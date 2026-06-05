import type { NextRequest } from "next/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas, notificacoes, obras, users } from "@shared/db/schema";
import { sendCandidaturaDecididaEmail } from "@shared/lib/email";
import { recordAudit } from "@features/auth/api/audit";
import { emailPreferenceEnabled } from "./preferences";

function formatarValorBRL(valor: unknown): string {
  const num = Number(valor);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(num) ? num : 0);
}

interface DispararArgs {
  candidaturaId: string;
  /**
   * Quando vier de uma rota HTTP, passa a Request para o audit log capturar IP/UA.
   * Quando vier do job de fallback ou cancelamento implícito, fica `null`.
   */
  request?: NextRequest | null;
  /** "cron" para o job de fallback; "api"/"system" caso contrário. */
  source?: "api" | "cron" | "system";
  /**
   * Quando `true`, apenas marca a flag idempotente sem disparar notificação
   * (usado no cancelamento — empreiteiro foi o próprio actor).
   */
  silencioso?: boolean;
}

export interface DispararResult {
  status:
    | "sent"
    | "skipped"
    | "not_found"
    | "no_decision"
    | "no_user"
    | "silent"
    | "locked"
    | "failed";
  emailSent?: boolean;
  notifCreated?: boolean;
}

/**
 * Dispara (in-app + email) a notificação da decisão da candidatura para o
 * empreiteiro.
 *
 * Reliability model (Task #65):
 *   1. Aquisição de **advisory lock** (`pg_try_advisory_xact_lock`) keyed na
 *      UUID da candidatura — evita corrida entre duas chamadas concorrentes
 *      (route handler + job de fallback, p.ex.). Lock denegado ⇒ `skipped`.
 *   2. Re-check do estado dentro da transação (`SELECT … FOR UPDATE`).
 *   3. INSERT da notificação in-app **+** UPDATE `notificacao_disparada=true`
 *      acontecem na **mesma** transação. Se qualquer um falha, ambos sofrem
 *      rollback e a candidatura volta a estar elegível pro fallback.
 *   4. E-mail Brevo é enviado **após** o commit (best-effort — falhas não
 *      reabrem o flag, mas o audit captura `emailSent=false`).
 *
 * Cobre os 3 gatilhos:
 *   - aceite (status='aceita')
 *   - rejeição (status='rejeitada' e canceladaPeloEmpreiteiro=false)
 *   - cancelamento (silencioso=true → flipa flag sem in-app/email)
 */
export async function dispararNotificacaoCandidaturaDecidida(
  args: DispararArgs,
): Promise<DispararResult> {
  const { candidaturaId, request = null, source = "api", silencioso = false } = args;

  // 1) Stage: validações & tx (lock + insert + flip flag).
  let staged:
    | {
        kind: "sent" | "silent";
        empreiteiroEmail: string | null;
        empreiteiroNome: string;
        empreiteiroId: string;
        obraId: string | null;
        obraNome: string;
        resultado: "aceita" | "rejeitada";
        valorFormatado: string;
        href: string;
        motivoRejeicao: string | null;
        mensagemContratante: string | null;
        notifId: string | null;
      }
    | { kind: DispararResult["status"] };

  try {
    staged = await db.transaction(async (tx) => {
      // Advisory lock keyed na UUID (hashtext determinístico no PG).
      const lockRows = (await tx.execute(
        sql`SELECT pg_try_advisory_xact_lock(hashtext(${candidaturaId})) AS got`,
      )) as any;
      const got = (lockRows?.rows?.[0] ?? lockRows?.[0])?.got;
      if (got !== true) {
        return { kind: "locked" as const };
      }

      // Re-leitura sob lock — confiável.
      const [cand] = await tx
        .select()
        .from(candidaturas)
        .where(eq(candidaturas.id, candidaturaId));

      if (!cand) return { kind: "not_found" as const };
      if (cand.notificacaoDisparada) return { kind: "skipped" as const };
      if (!cand.decididaEm || cand.status === "pendente") {
        return { kind: "no_decision" as const };
      }
      if (!cand.empreiteiroId) return { kind: "no_user" as const };

      const silentMode = silencioso || cand.canceladaPeloEmpreiteiro;

      if (silentMode) {
        // Cancel pelo próprio empreiteiro: só flipa a flag pra remover do
        // fallback. Sem insert de notif, sem email.
        await tx
          .update(candidaturas)
          .set({ notificacaoDisparada: true })
          .where(eq(candidaturas.id, candidaturaId));
        return { kind: "silent" as const };
      }

      // Carrega obra + empreiteiro (dentro da tx, sem custo extra).
      const [obra] = cand.obraId
        ? await tx
            .select({ id: obras.id, nome: obras.nome })
            .from(obras)
            .where(eq(obras.id, cand.obraId))
        : [undefined];

      const [empreiteiro] = await tx
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, cand.empreiteiroId));

      if (!empreiteiro) return { kind: "no_user" as const };

      const resultado: "aceita" | "rejeitada" =
        cand.status === "aceita" ? "aceita" : "rejeitada";
      const obraNome = obra?.nome ?? "sua obra";
      const valorFormatado = formatarValorBRL(cand.valorProposta);
      const href = obra
        ? resultado === "aceita"
          ? `/empreiteiro/minhas-obras/${obra.id}`
          : `/empreiteiro/minhas-candidaturas`
        : `/empreiteiro/minhas-candidaturas`;
      const titulo =
        resultado === "aceita"
          ? "Sua proposta foi aceita!"
          : "Sua proposta não foi selecionada";
      const descricao =
        resultado === "aceita"
          ? `O contratante aceitou sua proposta de ${valorFormatado} para a obra ${obraNome}.`
          : `O contratante seguiu com outra proposta para a obra ${obraNome}.`;

      // INSERT in-app notif + UPDATE flag são atômicos na mesma tx.
      // Rollback se qualquer um falhar — fallback retoma na próxima rodada.
      const [notif] = await tx
        .insert(notificacoes)
        .values({
          userId: empreiteiro.id,
          tipo: resultado === "aceita" ? "sucesso" : "info",
          titulo,
          descricao,
          href,
        })
        .returning({ id: notificacoes.id });

      await tx
        .update(candidaturas)
        .set({ notificacaoDisparada: true })
        .where(eq(candidaturas.id, candidaturaId));

      return {
        kind: "sent" as const,
        empreiteiroEmail: empreiteiro.email ?? null,
        empreiteiroNome: empreiteiro.name ?? "Empreiteiro",
        empreiteiroId: empreiteiro.id,
        obraId: cand.obraId ?? null,
        obraNome,
        resultado,
        valorFormatado,
        href,
        motivoRejeicao: cand.motivoRejeicao ?? null,
        mensagemContratante: cand.mensagemContratante ?? null,
        notifId: notif?.id ?? null,
      };
    });
  } catch (err) {
    console.error("[candidatura-dispatcher] tx falhou:", err);
    // Tx rollback ⇒ flag continua false ⇒ fallback retoma.
    return { status: "failed" };
  }

  if (staged.kind !== "sent" || !("empreiteiroEmail" in staged)) {
    return { status: staged.kind } as DispararResult;
  }

  // 2) Pós-commit: e-mail best-effort, respeitando preferência do empreiteiro
  // (J02 §4). In-app já foi criada acima — opt-out vale só pro email.
  // O email vai pro EMPREITEIRO; gateamos por `email_contrato` (chave que ele
  // controla no settings — a decisão da proposta é o vínculo contratual), e não
  // por `email_novaProposta`, que é uma chave da persona contratante.
  let emailSent = false;
  const emailPermitido = staged.empreiteiroEmail
    ? await emailPreferenceEnabled(staged.empreiteiroId, "email_contrato")
    : false;
  if (staged.empreiteiroEmail && emailPermitido) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
    const link = baseUrl ? `${baseUrl}${staged.href}` : staged.href;
    try {
      await sendCandidaturaDecididaEmail(staged.empreiteiroEmail, {
        empreiteiroNome: staged.empreiteiroNome,
        obraNome: staged.obraNome,
        resultado: staged.resultado,
        valorFormatado: staged.valorFormatado,
        motivoRejeicao: staged.motivoRejeicao,
        mensagemContratante: staged.mensagemContratante,
        link,
      });
      emailSent = true;
    } catch (err) {
      console.error("[candidatura-dispatcher] falha ao enviar email:", err);
    }
  }

  void recordAudit({
    actorId: staged.empreiteiroId,
    action: "candidaturas.notificar",
    targetUserId: staged.empreiteiroId,
    payload: {
      candidaturaId,
      obraId: staged.obraId,
      resultado: staged.resultado,
      emailSent,
      notifId: staged.notifId,
      source,
    },
    request: request ?? undefined,
  });

  return { status: "sent", emailSent, notifCreated: !!staged.notifId };
}

/**
 * Job de fallback (CLI/cron): varre candidaturas com decisão tomada mas
 * `notificacao_disparada=false` e tenta disparar para cada uma. Idempotente.
 *
 * Como o flag só vira `true` em uma tx que também inseriu a notif in-app,
 * qualquer crash/timeout deixa a candidatura elegível pra ser retomada aqui.
 */
export async function dispatchPendingCandidaturaNotifications(opts?: {
  limit?: number;
}): Promise<{ checked: number; sent: number; silent: number; failed: number; skipped: number }> {
  const limit = Math.max(1, Math.min(opts?.limit ?? 200, 1000));

  const pendentes = await db
    .select({
      id: candidaturas.id,
      canceladaPeloEmpreiteiro: candidaturas.canceladaPeloEmpreiteiro,
    })
    .from(candidaturas)
    .where(
      and(
        eq(candidaturas.notificacaoDisparada, false),
        isNotNull(candidaturas.decididaEm),
      ),
    )
    .limit(limit);

  let sent = 0;
  let silent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of pendentes) {
    try {
      const r = await dispararNotificacaoCandidaturaDecidida({
        candidaturaId: row.id,
        source: "cron",
        silencioso: row.canceladaPeloEmpreiteiro === true,
      });
      if (r.status === "sent") sent++;
      else if (r.status === "silent") silent++;
      else if (r.status === "skipped" || r.status === "locked") skipped++;
      else failed++;
    } catch {
      failed++;
    }
  }

  return { checked: pendentes.length, sent, silent, skipped, failed };
}
