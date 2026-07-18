import { and, eq, lt, ne, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, auditLogs, users } from "@shared/db/schema";

/**
 * Número de dias de carência padrão após `renovaEm` antes de revogar o plano
 * de um assinante inadimplente. Configurável via `INADIMPLENTE_GRACE_DAYS`.
 */
const DEFAULT_GRACE_DAYS = 7;

/**
 * Buffer adicional (em horas) após o fim do período de carência antes de
 * efetivamente revogar o acesso. Protege o assinante contra falhas transitórias
 * do gateway que atrasem o webhook `payment_succeeded` além da janela de
 * carência. Configurável via `INADIMPLENTE_DOWNGRADE_BUFFER_HOURS`.
 *
 * Exemplo: com GRACE_DAYS=7 e BUFFER_HOURS=48, a revogação só ocorre após
 * 7 dias + 48 horas de inadimplência — dando tempo suficiente para o gateway
 * reprocessar o evento de pagamento.
 */
const DEFAULT_BUFFER_HOURS = 48;

export interface DowngradeInadimplentesResult {
  ok: boolean;
  downgraded: number;
  runAt: string;
  error?: string;
}

/**
 * Optional hooks for testing only. Injected via the third argument of
 * `downgradeInadimplentes`. Never used in production.
 *
 * `onCandidatesSelected` is called once after the SELECT phase but before any
 * per-row UPDATE runs. Tests can use this window to simulate a concurrent
 * `payment_succeeded` webhook that reactivates one of the candidates, making
 * the job's UPDATE guard (`AND status='inadimplente'`) the only thing standing
 * between the guard and an incorrect downgrade.
 */
export interface DowngradeTestHooks {
  onCandidatesSelected?: (
    candidates: ReadonlyArray<{ id: string; userId: string }>,
  ) => Promise<void>;
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
 * Parseia e valida o buffer adicional em horas.
 * Retorna o valor padrão se a entrada for inválida.
 * Aceita valores fracionários (ex: 0.5 = 30min) para facilitar testes.
 */
function parseBufferHours(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return n;
  return DEFAULT_BUFFER_HOURS;
}

/**
 * Calcula o instante de corte (cutoff) para revogação de inadimplentes:
 * `now - graceDays - bufferHours`.
 *
 * Qualquer assinatura com `renovaEm < cutoff` é elegível para rebaixo.
 * Esta função pura é exportada para facilitar testes unitários.
 *
 * @param graceDays  Dias de carência após `renovaEm`.
 * @param bufferHours  Buffer adicional em horas após o fim da carência.
 * @param now  Momento de referência (default: Date.now()).
 */
export function computeDowngradeCutoff(
  graceDays: number,
  bufferHours: number,
  now: number = Date.now(),
): Date {
  const cutoffMs =
    now - graceDays * 24 * 60 * 60 * 1000 - bufferHours * 60 * 60 * 1000;
  return new Date(cutoffMs);
}

/**
 * Job idempotente que revoga o acesso de assinantes inadimplentes cujo período
 * de carência E buffer adicional expiraram.
 *
 * Critério: `status = 'inadimplente'` AND
 *   `renovaEm < NOW() - graceDays - bufferHours`.
 *
 * O buffer adicional (`INADIMPLENTE_DOWNGRADE_BUFFER_HOURS`, default 48h)
 * garante que uma falha transitória do gateway que atrase o webhook
 * `payment_succeeded` além da janela de carência não rebaixe o assinante
 * indevidamente. Se o pagamento chegar dentro do buffer, o webhook ainda
 * reativa a assinatura antes do próximo ciclo do job.
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
 * A janela de carência é configurável via `INADIMPLENTE_GRACE_DAYS` (default
 * 7 dias) e o buffer adicional via `INADIMPLENTE_DOWNGRADE_BUFFER_HOURS`
 * (default 48 horas).
 *
 * Pensado para rodar diariamente via Replit Scheduled Deployment
 * (`scripts/downgrade-inadimplente.ts`). Pode ser chamado manualmente ou
 * em testes — é completamente idempotente.
 */
export async function downgradeInadimplentes(
  graceDays?: number,
  bufferHours?: number,
  _testHooks?: DowngradeTestHooks,
): Promise<DowngradeInadimplentesResult> {
  const runAt = new Date().toISOString();

  const days = parseGraceDays(
    graceDays ?? process.env.INADIMPLENTE_GRACE_DAYS ?? DEFAULT_GRACE_DAYS,
  );

  const buffer = parseBufferHours(
    bufferHours ?? process.env.INADIMPLENTE_DOWNGRADE_BUFFER_HOURS ?? DEFAULT_BUFFER_HOURS,
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
            sql`NOW() - (${days} || ' days')::interval - (${buffer} || ' hours')::interval`,
          ),
        ),
      );

    if (candidates.length === 0) {
      console.info(
        `[downgrade-inadimplente] runAt=${runAt} downgraded=0 graceDays=${days} bufferHours=${buffer}`,
      );
      return { ok: true, downgraded: 0, runAt };
    }

    // Test seam: allow tests to inject a concurrent side-effect (e.g. a
    // payment_succeeded webhook) between the SELECT and the per-row UPDATEs.
    // Never called in production (no caller passes _testHooks).
    if (_testHooks?.onCandidatesSelected) {
      await _testHooks.onCandidatesSelected(candidates);
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
                  sql`NOW() - (${days} || ' days')::interval - (${buffer} || ' hours')::interval`,
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
            payloadJson: { graceDays: days, bufferHours: buffer, downgradedAt: runAt },
          });

          downgraded++;
          downgradedIds.push(row.id);
          console.info(
            `[downgrade-inadimplente] downgraded assinaturaId=${row.id} userId=${row.userId} graceDays=${days} bufferHours=${buffer}`,
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
            bufferHours: buffer,
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
      `[downgrade-inadimplente] runAt=${runAt} downgraded=${downgraded} graceDays=${days} bufferHours=${buffer}`,
    );
    return { ok: true, downgraded, runAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[downgrade-inadimplente] falha:", err);
    return { ok: false, downgraded: 0, runAt, error: message };
  }
}
