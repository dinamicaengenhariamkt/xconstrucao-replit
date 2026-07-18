import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  assinaturaEventos,
  assinaturas,
  auditLogs,
  notificacoes,
  planos,
  userPreferencias,
  users,
} from "@shared/db/schema";
import { sendAvisoExpiracaoEmail } from "@shared/lib/email";
import { emailEnabledFromPrefs } from "@features/notificacoes/preferences";

/**
 * Número de dias de carência padrão após `renovaEm` antes de revogar o plano.
 * Espelha a constante do downgrade job — devem sempre estar em sincronia.
 */
const DEFAULT_GRACE_DAYS = 7;

/**
 * Quantos dias antes do término da carência o aviso é enviado.
 * Ex.: graceDays=7, WARN_BEFORE=3 → aviso enviado no dia 4 de inadimplência.
 */
const WARN_BEFORE_DAYS = 3;

export interface AvisoExpiracaoResult {
  ok: boolean;
  notified: number;
  skipped: number;
  runAt: string;
  error?: string;
}

function parseGraceDays(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0 && Number.isInteger(n)) return n;
  return DEFAULT_GRACE_DAYS;
}

/**
 * Gera a chave de idempotência para o evento de aviso.
 * Usa `renovaEm` como âncora do ciclo, garantindo que um aviso por ciclo de
 * inadimplência seja enviado, mesmo que o job rode várias vezes por dia.
 */
function idempotencyKey(assinaturaId: string, renovaEm: Date): string {
  const dateStr = renovaEm.toISOString().slice(0, 10); // YYYY-MM-DD
  return `aviso_expiracao_3dias:${assinaturaId}:${dateStr}`;
}

/**
 * Job idempotente que notifica assinantes inadimplentes cujo período de
 * carência expira em WARN_BEFORE_DAYS dias.
 *
 * Critério: `status = 'inadimplente'`
 *           AND `renovaEm < NOW() - (graceDays - WARN_BEFORE_DAYS) days`
 *
 * Idempotência:
 *   Antes de enviar qualquer notificação, tenta inserir uma linha em
 *   `assinatura_eventos` com `tipo = 'aviso_expiracao_3dias'` e
 *   `gatewayEventId = 'aviso_expiracao_3dias:{assinaturaId}:{renovaEmDate}'`.
 *   O índice único `uq_assinatura_eventos_gateway` garante que re-execuções
 *   do job no mesmo ciclo não re-enviam o aviso.
 *
 * Ações por assinante elegível:
 *   1. Insere evento de aviso em `assinatura_eventos` (idempotente)
 *   2. Cria notificação in-app (tipo `alerta`)
 *   3. Envia email Brevo respeitando `user_preferencias.notificacoes.email_prazo`
 *
 * Pensado para rodar diariamente via Replit Scheduled Deployment
 * (`scripts/aviso-expiracao-inadimplente.ts`). Pode ser chamado manualmente —
 * é completamente idempotente.
 */
export async function notificarInadimplentesExpirando(
  graceDays?: number,
): Promise<AvisoExpiracaoResult> {
  const runAt = new Date().toISOString();

  const days = parseGraceDays(
    graceDays ?? process.env.INADIMPLENTE_GRACE_DAYS ?? DEFAULT_GRACE_DAYS,
  );

  // Se a janela de aviso for maior ou igual à carência, não há janela útil.
  if (WARN_BEFORE_DAYS >= days) {
    console.info(
      `[aviso-expiracao] WARN_BEFORE_DAYS=${WARN_BEFORE_DAYS} >= graceDays=${days} — nada a fazer`,
    );
    return { ok: true, notified: 0, skipped: 0, runAt };
  }

  const warnThresholdDays = days - WARN_BEFORE_DAYS;

  try {
    // Busca candidatos: inadimplentes que já passaram o threshold do aviso.
    // Inclui também os que já passaram a carência completa mas ainda não foram
    // rebaixados (o downgrade job cuidará deles; aqui apenas avisamos se o
    // evento de aviso ainda não foi emitido para o ciclo atual).
    const candidates = await db
      .select({
        id: assinaturas.id,
        userId: assinaturas.userId,
        renovaEm: assinaturas.renovaEm,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        planoNome: planos.nome,
        prefsNotificacoes: userPreferencias.notificacoes,
      })
      .from(assinaturas)
      .innerJoin(users, eq(users.id, assinaturas.userId))
      .innerJoin(planos, eq(planos.id, assinaturas.planoId))
      .leftJoin(userPreferencias, eq(userPreferencias.userId, assinaturas.userId))
      .where(
        and(
          eq(assinaturas.status, "inadimplente"),
          lt(
            assinaturas.renovaEm,
            sql`NOW() - (${warnThresholdDays} || ' days')::interval`,
          ),
          eq(users.ativo, true),
        ),
      );

    if (candidates.length === 0) {
      console.info(`[aviso-expiracao] runAt=${runAt} notified=0 skipped=0`);
      return { ok: true, notified: 0, skipped: 0, runAt };
    }

    let notified = 0;
    let skipped = 0;
    const notifiedIds: string[] = [];

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

    for (const row of candidates) {
      if (!row.renovaEm) {
        skipped++;
        continue;
      }

      const idemKey = idempotencyKey(row.id, row.renovaEm);

      try {
        // Tenta inserir o evento de aviso. Se já existir (conflito no índice
        // único), `returning` devolve array vazio → já foi notificado.
        const inserted = await db
          .insert(assinaturaEventos)
          .values({
            assinaturaId: row.id,
            tipo: "aviso_expiracao_3dias",
            gatewayEventId: idemKey,
            payloadJson: {
              graceDays: days,
              warnBeforeDays: WARN_BEFORE_DAYS,
              runAt,
            },
          })
          .onConflictDoNothing()
          .returning({ id: assinaturaEventos.id });

        if (inserted.length === 0) {
          // Evento já existia → aviso já enviado neste ciclo.
          skipped++;
          console.info(
            `[aviso-expiracao] já notificado assinaturaId=${row.id} — pulando`,
          );
          continue;
        }

        // Calcula dias restantes para a mensagem.
        const agora = new Date();
        const expiraEm = new Date(row.renovaEm);
        expiraEm.setDate(expiraEm.getDate() + days);
        const msRestantes = expiraEm.getTime() - agora.getTime();
        const diasRestantes = Math.max(
          1,
          Math.ceil(msRestantes / (1000 * 60 * 60 * 24)),
        );

        const expiracaoFormatada = expiraEm.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "America/Sao_Paulo",
        });

        // Monta href de acordo com a role do usuário.
        const hrefPath =
          row.userRole === "empreiteiro"
            ? "/empreiteiro/configuracoes"
            : "/contratante/pagamentos";
        const link = baseUrl ? `${baseUrl}${hrefPath}` : hrefPath;

        // Notificação in-app (alerta).
        try {
          await db
            .insert(notificacoes)
            .values({
              userId: row.userId,
              tipo: "alerta",
              titulo: "Seu acesso expira em breve",
              descricao: `Há uma pendência de pagamento no seu plano ${row.planoNome}. Regularize para não perder o acesso.`,
              href: hrefPath,
            })
            .onConflictDoNothing({
              target: [notificacoes.userId, notificacoes.href],
              where: sql`${notificacoes.lida} = false AND ${notificacoes.href} IS NOT NULL`,
            });
        } catch (notifErr) {
          console.error(
            `[aviso-expiracao] falha ao criar notificação in-app userId=${row.userId}:`,
            notifErr,
          );
        }

        // Email (respeita preferência `email_prazo`).
        const emailEnabled = emailEnabledFromPrefs(
          row.prefsNotificacoes,
          "email_prazo",
        );
        if (emailEnabled && row.userEmail) {
          try {
            await sendAvisoExpiracaoEmail(row.userEmail, {
              userName: row.userName ?? "Usuário",
              planoNome: row.planoNome ?? "Plano",
              diasRestantes,
              expiracaoFormatada,
              link,
            });
          } catch (emailErr) {
            console.error(
              `[aviso-expiracao] falha ao enviar email userId=${row.userId}:`,
              emailErr,
            );
          }
        }

        notified++;
        notifiedIds.push(row.id);
        console.info(
          `[aviso-expiracao] notificado assinaturaId=${row.id} userId=${row.userId} diasRestantes=${diasRestantes}`,
        );
      } catch (rowErr) {
        console.error(
          `[aviso-expiracao] erro ao processar assinaturaId=${row.id}:`,
          rowErr,
        );
        skipped++;
      }
    }

    if (notified > 0) {
      try {
        await db.insert(auditLogs).values({
          actorId: null,
          action: "assinatura.aviso-expiracao",
          targetUserId: null,
          payload: {
            notified,
            skipped,
            graceDays: days,
            warnBeforeDays: WARN_BEFORE_DAYS,
            runAt,
            ids: notifiedIds,
          },
          ip: "cron",
          userAgent: "aviso-expiracao-job",
        });
      } catch (auditErr) {
        console.error(
          "[aviso-expiracao] falha ao gravar audit log:",
          auditErr,
        );
      }
    }

    console.info(
      `[aviso-expiracao] runAt=${runAt} notified=${notified} skipped=${skipped}`,
    );
    return { ok: true, notified, skipped, runAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[aviso-expiracao] falha:", err);
    return { ok: false, notified: 0, skipped: 0, runAt, error: message };
  }
}
