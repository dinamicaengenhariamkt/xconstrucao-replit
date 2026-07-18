import { and, eq, lt, ne, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, auditLogs, users } from "@shared/db/schema";

/**
 * Número de dias de carência padrão após `renovaEm` antes de revogar o plano
 * de um assinante inadimplente. Configurável via `INADIMPLENTE_GRACE_DAYS`.
 */
const DEFAULT_GRACE_DAYS = 7;

export interface DowngradeInadimplentesResult {
  ok: boolean;
  downgraded: number;
  runAt: string;
  error?: string;
}

/**
 * Parseia e valida o número de dias de carência.
 * Retorna o valor padrão se a entrada for inválida.
 */
function parseGraceDays(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0 && Number.isInteger(n)) return n;
  return DEFAULT_GRACE_DAYS;
}

/**
 * Job idempotente que revoga o acesso de assinantes inadimplentes cujo período
 * de carência expirou.
 *
 * Critério: `status = 'inadimplente'` AND `renovaEm < NOW() - graceDays`.
 *
 * Ações por assinatura elegível (dentro de uma transação atômica):
 *   1. `assinaturas.status` → `expirada`  (UPDATE condicional — guard de race)
 *   2. `users.plano` → `free`             (somente se o UPDATE acima afetou 1
 *      linha E o usuário não tem outra assinatura ativa paga)
 *   3. Evento `grace_period_expired` em `assinatura_eventos`
 *   4. Linha em `audit_logs` (actor=null, ip="cron")
 *
 * Proteção contra race condition (webhook vs job):
 *   O UPDATE de assinaturas inclui `AND status = 'inadimplente'` no WHERE.
 *   Se um `payment_succeeded` chegar entre o SELECT e o UPDATE e promover a
 *   assinatura para `ativa`, o UPDATE retornará 0 linhas e o job pula o
 *   rebaixo desse usuário — acesso não é removido indevidamente.
 *
 * Proteção contra falso-negativo em re-assinantes:
 *   Um usuário pode ter uma linha `inadimplente` antiga e uma nova linha
 *   `ativa` (re-assinatura). Nesse caso o job expira a linha antiga mas NÃO
 *   toca `users.plano` (o usuário está pagando ativamente).
 *
 * A janela de carência é configurável via a variável de ambiente
 * `INADIMPLENTE_GRACE_DAYS` (default: 7 dias).
 *
 * Pensado para rodar diariamente via Replit Scheduled Deployment
 * (`scripts/downgrade-inadimplente.ts`). Pode ser chamado manualmente ou
 * em testes — é completamente idempotente.
 */
export async function downgradeInadimplentes(
  graceDays?: number,
): Promise<DowngradeInadimplentesResult> {
  const runAt = new Date().toISOString();

  const days = parseGraceDays(
    graceDays ?? process.env.INADIMPLENTE_GRACE_DAYS ?? DEFAULT_GRACE_DAYS,
  );

  try {
    const candidates = await db
      .select({ id: assinaturas.id, userId: assinaturas.userId })
      .from(assinaturas)
      .where(
        and(
          eq(assinaturas.status, "inadimplente"),
          lt(
            assinaturas.renovaEm,
            sql`NOW() - (${days} || ' days')::interval`,
          ),
        ),
      );

    if (candidates.length === 0) {
      console.info(`[downgrade-inadimplente] runAt=${runAt} downgraded=0`);
      return { ok: true, downgraded: 0, runAt };
    }

    let downgraded = 0;
    const downgradedIds: string[] = [];

    for (const row of candidates) {
      try {
        await db.transaction(async (tx) => {
          // Atomic conditional UPDATE: re-checks status='inadimplente' so that
          // if a concurrent payment_succeeded webhook already reactivated this
          // row, the UPDATE returns 0 rows and we skip all side-effects.
          const updated = await tx
            .update(assinaturas)
            .set({ status: "expirada" })
            .where(
              and(
                eq(assinaturas.id, row.id),
                eq(assinaturas.status, "inadimplente"),
                lt(
                  assinaturas.renovaEm,
                  sql`NOW() - (${days} || ' days')::interval`,
                ),
              ),
            )
            .returning({ id: assinaturas.id });

          if (updated.length === 0) {
            // Row was concurrently reactivated or no longer meets criteria.
            return;
          }

          // Only clear users.plano when the user has NO other active paid
          // subscription. A user may have re-subscribed (new 'ativa' row)
          // while this old row remained 'inadimplente'. In that case we expire
          // the stale row but must NOT touch users.plano.
          const activeRow = await tx
            .select({ id: assinaturas.id })
            .from(assinaturas)
            .where(
              and(
                eq(assinaturas.userId, row.userId),
                eq(assinaturas.status, "ativa"),
                ne(assinaturas.id, row.id),
              ),
            )
            .limit(1);

          if (activeRow.length === 0) {
            await tx
              .update(users)
              .set({ plano: "free" })
              .where(eq(users.id, row.userId));
          } else {
            console.info(
              `[downgrade-inadimplente] skipped users.plano for userId=${row.userId} — has active subscription assinaturaId=${activeRow[0].id}`,
            );
          }

          await tx.insert(assinaturaEventos).values({
            assinaturaId: row.id,
            tipo: "grace_period_expired",
            gatewayEventId: null,
            payloadJson: { graceDays: days, downgradedAt: runAt },
          });

          downgraded++;
          downgradedIds.push(row.id);
          console.info(
            `[downgrade-inadimplente] downgraded assinaturaId=${row.id} userId=${row.userId} graceDays=${days}`,
          );
        });
      } catch (rowErr) {
        console.error(
          `[downgrade-inadimplente] erro ao processar assinaturaId=${row.id}:`,
          rowErr,
        );
      }
    }

    if (downgraded > 0) {
      try {
        await db.insert(auditLogs).values({
          actorId: null,
          action: "assinatura.grace-period-downgrade",
          targetUserId: null,
          payload: {
            downgraded,
            graceDays: days,
            runAt,
            ids: downgradedIds,
          },
          ip: "cron",
          userAgent: "downgrade-inadimplente-job",
        });
      } catch (auditErr) {
        console.error(
          "[downgrade-inadimplente] falha ao gravar audit log:",
          auditErr,
        );
      }
    }

    console.info(
      `[downgrade-inadimplente] runAt=${runAt} downgraded=${downgraded}`,
    );
    return { ok: true, downgraded, runAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[downgrade-inadimplente] falha:", err);
    return { ok: false, downgraded: 0, runAt, error: message };
  }
}
