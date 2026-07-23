import { after, NextRequest, NextResponse } from "next/server";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { candidaturas, clientes, empreiteiras, obras } from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { dispararNotificacaoCandidaturaDecidida } from "@features/notificacoes/candidatura-dispatcher";
import { dispararNotificacaoObraContratadaAdmin } from "@features/notificacoes/marketplace-admin-dispatcher";
import { dispararNotificacaoVezDeAssinar } from "@features/notificacoes/contrato-dispatcher";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { garantirChatThread } from "@features/chat/service";

const bodySchema = z.object({
  mensagem: z.string().max(1000).optional(),
});

/**
 * POST /api/contratante/candidaturas/[id]/aceitar
 *
 * Aceite **transacional** com lock pessimista:
 *  1. SELECT … FOR UPDATE na obra → evita 2 aceites simultâneos.
 *  2. Valida ownership (contratante dono) ou admin.
 *  3. Valida obra ainda livre (empreiteira_id IS NULL).
 *  4. Resolve empreiteiras.id via lookup pelo user_id do candidato.
 *  5. UPDATE obra: empreiteira_id + status='em_andamento'.
 *  6. UPDATE candidatura: status='aceita' + mensagem opcional.
 *  7. UPDATE concorrentes: status='rejeitada' + motivo padrão.
 *
 * Audit log: `candidaturas.aceitar`.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (!isAdminLike(guard.user.role) && guard.user.role !== "contratante") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id: candidaturaId } = await ctx.params;
  let bodyJson: unknown = {};
  try {
    bodyJson = await request.json();
  } catch {
    // body opcional
  }
  const parsedBody = bodySchema.safeParse(bodyJson);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "INVALID_BODY", errors: parsedBody.error.flatten() }, { status: 400 });
  }
  const mensagem = parsedBody.data.mensagem ?? null;

  try {
    const result = await db.transaction(async (tx) => {
      // Buscar candidatura (sem lock — só para descobrir obraId).
      const [cand] = await tx
        .select()
        .from(candidaturas)
        .where(eq(candidaturas.id, candidaturaId));
      if (!cand) return { code: 404 as const, body: { error: "NOT_FOUND" } };
      if (cand.status !== "pendente") {
        return { code: 409 as const, body: { error: "INVALID_STATE", message: "Esta proposta não está mais pendente." } };
      }
      if (!cand.obraId || !cand.empreiteiroId) {
        return { code: 422 as const, body: { error: "CANDIDATURA_INCOMPLETA" } };
      }

      // Lock pessimista na obra.
      const obraRows = await tx.execute(
        sql`SELECT id, cliente_id, empreiteira_id, status FROM obras WHERE id = ${cand.obraId} FOR UPDATE`,
      );
      const obraRow = (obraRows as any).rows?.[0] ?? (obraRows as any)[0];
      if (!obraRow) return { code: 404 as const, body: { error: "OBRA_NOT_FOUND" } };

      // Ownership (admin pula).
      if (!isAdminLike(guard.user.role)) {
        const [cli] = await tx.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
        if (!cli || obraRow.cliente_id !== cli.id) {
          return { code: 403 as const, body: { error: "FORBIDDEN", message: "Você não é dono desta obra." } };
        }
      }

      if (obraRow.empreiteira_id) {
        return {
          code: 409 as const,
          body: { error: "OBRA_JA_TEM_EMPREITEIRA", message: "Esta obra já tem empreiteira contratada." },
        };
      }

      // Resolver empreiteira do candidato.
      const [emp] = await tx
        .select({ id: empreiteiras.id })
        .from(empreiteiras)
        .where(eq(empreiteiras.userId, cand.empreiteiroId));
      if (!emp) {
        return {
          code: 422 as const,
          body: {
            error: "EMPREITEIRO_SEM_PERFIL",
            message: "O empreiteiro selecionado não tem perfil de empresa configurado.",
          },
        };
      }

      const now = new Date();

      // 1) Vincular obra + propagar valorTotal da proposta aceita (Item 14 J40).
      // valorProposta é a fonte de verdade do valor contratado; o lock
      // OBRA_LOCKED_AFTER_BIND (obras/[id]/route.ts) protege o campo após o vínculo.
      //
      // J58 — o aceite NÃO promove mais a obra a `em_andamento` direto: ela entra
      // no fluxo de contrato (`contratoStatus = pendente_contratante`). A promoção
      // a `em_andamento` acontece na rota de assinatura, quando AMBAS as partes
      // assinam. O vínculo (empreiteiraId) e o valorTotal continuam sendo setados
      // aqui — o contrato só governa o `status`.
      const obraAceiteSet: Record<string, unknown> = {
        empreiteiraId: emp.id,
        contratoStatus: "pendente_contratante",
        updatedAt: now,
      };
      if (cand.valorProposta !== null && cand.valorProposta !== undefined) {
        obraAceiteSet.valorTotal = cand.valorProposta;
      }
      await tx
        .update(obras)
        .set(obraAceiteSet)
        .where(eq(obras.id, cand.obraId));

      // 1.5) Resolver contratanteUserId pra criação pós-commit da thread de chat (J13).
      // Mantemos o lookup dentro da tx (consistência) mas o INSERT da thread roda
      // fora, isolando o aceite de qualquer falha na chat.
      let contratanteUserIdParaChat: string | null = null;
      if (obraRow.cliente_id) {
        const [cliUser] = await tx
          .select({ userId: clientes.userId })
          .from(clientes)
          .where(eq(clientes.id, obraRow.cliente_id));
        contratanteUserIdParaChat = cliUser?.userId ?? null;
      }

      // 2) Aceitar candidatura — atômico: WHERE id=? AND status='pendente'.
      // Se outra request marcou rejeitada/cancelada entre o SELECT inicial
      // e este UPDATE, rowCount=0 e fazemos rollback via throw.
      const aceitas = await tx
        .update(candidaturas)
        .set({
          status: "aceita",
          mensagemContratante: mensagem,
          decididaEm: now,
        })
        .where(and(eq(candidaturas.id, candidaturaId), eq(candidaturas.status, "pendente")))
        .returning({ id: candidaturas.id });
      if (aceitas.length === 0) {
        throw new Error("CANDIDATURA_STATE_CHANGED");
      }

      // 3) Rejeitar concorrentes pendentes.
      const rejeitadas = await tx
        .update(candidaturas)
        .set({
          status: "rejeitada",
          motivoRejeicao: "Outra proposta foi selecionada",
          decididaEm: now,
        })
        .where(
          and(
            eq(candidaturas.obraId, cand.obraId),
            ne(candidaturas.id, candidaturaId),
            eq(candidaturas.status, "pendente"),
          ),
        )
        .returning({ id: candidaturas.id });

      return {
        code: 200 as const,
        body: {
          ok: true,
          obraId: cand.obraId,
          candidaturaId,
          empreiteiraId: emp.id,
          rejeitadasCount: rejeitadas.length,
          rejeitadasIds: rejeitadas.map((r) => r.id),
        },
        chatThreadArgs:
          contratanteUserIdParaChat && cand.empreiteiroId
            ? {
                obraId: cand.obraId,
                contratanteUserId: contratanteUserIdParaChat,
                empreiteiroUserId: cand.empreiteiroId,
              }
            : null,
      };
    });

    if (result.code === 200) {
      const obraIdAceita = (result.body as any).obraId as string;
      void recordAudit({
        actorId: guard.user.id,
        action: "candidaturas.aceitar",
        targetUserId: null,
        payload: {
          obraId: obraIdAceita,
          candidaturaId,
          empreiteiraId: (result.body as any).empreiteiraId,
          rejeitadasCount: (result.body as any).rejeitadasCount,
        },
        request,
      });

      // J07: target = empreiteiro user da candidatura aceita (vai pro feed dele).
      const empAceitaId = (result.body as any).empreiteiraId as string;
      const [empAceita] = await db
        .select({ userId: empreiteiras.userId })
        .from(empreiteiras)
        .where(eq(empreiteiras.id, empAceitaId));
      void registrarAtividade({
        tipo: "candidatura_aceita",
        actorUserId: guard.user.id,
        obraId: obraIdAceita,
        targetUserId: empAceita?.userId ?? null,
        payload: { candidaturaId, empreiteiraId: empAceitaId },
      });
      const rejeitadasIdsAtv: string[] = (result.body as any).rejeitadasIds ?? [];
      // Lookup batch dos donos (user ids) das candidaturas rejeitadas em cascade.
      // candidaturas.empreiteiroId já é users.id (não empreiteiras.id).
      let rejeitadasTargets: Map<string, string | null> = new Map();
      if (rejeitadasIdsAtv.length > 0) {
        const rows = await db
          .select({ candId: candidaturas.id, userId: candidaturas.empreiteiroId })
          .from(candidaturas)
          .where(inArray(candidaturas.id, rejeitadasIdsAtv));
        rejeitadasTargets = new Map(rows.map((r) => [r.candId, r.userId ?? null]));
      }
      for (const rid of rejeitadasIdsAtv) {
        void registrarAtividade({
          tipo: "candidatura_rejeitada",
          actorUserId: guard.user.id,
          obraId: obraIdAceita,
          targetUserId: rejeitadasTargets.get(rid) ?? null,
          payload: {
            candidaturaId: rid,
            motivo: "Outra proposta foi selecionada",
            cascata: true,
          },
        });
      }

      // Notifica empreiteiro vencedor + rejeitados em cascata (best-effort,
      // idempotente via flag `notificacao_disparada`).
      void dispararNotificacaoCandidaturaDecidida({ candidaturaId, request });

      // J57: notifica admins do evento-chave "obra contratada" — só no aceite,
      // nunca a cada proposta. Fire-and-forget, resolve as partes por obraId.
      void dispararNotificacaoObraContratadaAdmin(obraIdAceita).catch((err) => {
        console.error("[aceitar] falha no disparo marketplace-admin:", err);
      });

      // J58: a obra entrou no fluxo de contrato — avisa o contratante que é a vez
      // dele assinar (contratante assina 1º). Fire-and-forget.
      void dispararNotificacaoVezDeAssinar(obraIdAceita, "contratante").catch((err) => {
        console.error("[aceitar] falha no disparo contrato (vez de assinar):", err);
      });
      const rejeitadasIds: string[] = (result.body as any).rejeitadasIds ?? [];
      for (const rid of rejeitadasIds) {
        void dispararNotificacaoCandidaturaDecidida({ candidaturaId: rid, request });
      }

      // J13 — criar thread de chat fora da tx do aceite (best-effort com 1 retry).
      // `after()` garante execução pós-response inclusive em runtime serverless.
      // Erros aqui não afetam o aceite — a thread fica recuperável.
      const chatThreadArgs = result.chatThreadArgs;
      if (chatThreadArgs) {
        after(async () => {
          try {
            await garantirChatThread(chatThreadArgs);
          } catch (firstErr) {
            console.warn(
              "[chat] 1ª tentativa de criar thread falhou, tentando novamente:",
              firstErr,
              chatThreadArgs,
            );
            await new Promise((r) => setTimeout(r, 500));
            try {
              await garantirChatThread(chatThreadArgs);
            } catch (retryErr) {
              console.error(
                "[chat] falha persistente ao criar thread:",
                retryErr,
                chatThreadArgs,
              );
            }
          }
        });
      } else {
        console.warn(
          "[chat] thread não criada — contratanteUserId ou empreiteiroUserId ausente para obra",
          obraIdAceita,
        );
      }
    }

    const r = NextResponse.json(result.body, { status: result.code });
    setNoCacheHeaders(r);
    return r;
  } catch (err: any) {
    if (err?.message === "CANDIDATURA_STATE_CHANGED") {
      const r = NextResponse.json(
        { error: "INVALID_STATE", message: "Esta proposta não está mais pendente." },
        { status: 409 },
      );
      setNoCacheHeaders(r);
      return r;
    }
    console.error("[POST aceitar candidatura]", err);
    const r = NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
    setNoCacheHeaders(r);
    return r;
  }
}
