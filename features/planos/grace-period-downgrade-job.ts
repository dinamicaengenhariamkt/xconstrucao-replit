import { and, eq, lt, ne, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { assinaturaEventos, assinaturas, auditLogs, planos, users } from "@shared/db/schema";
import { getPaymentGateway } from "@features/planos/gateway";

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
  /** Assinaturas promovidas de volta a `ativa` após consulta proativa ao gateway. */
  reactivated: number;
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
 * Job idempotente de duas fases que protege assinantes contra interrupções
 * prolongadas do gateway de pagamento.
 *
 * ─── Fase 1: inadimplente → pendente_reativacao ────────────────────────────
 * Assinaturas com `status = 'inadimplente'` e `renovaEm < cutoff` são movidas
 * para `pendente_reativacao` (estado protegido) em vez de diretamente para
 * `expirada`. Isso garante que mesmo que um outage do gateway dure mais do que
 * o buffer, o assinante não perde acesso imediatamente.
 *
 * ─── Fase 2: pendente_reativacao → ativa | expirada ────────────────────────
 * Para CADA assinatura em `pendente_reativacao` (incluindo as de execuções
 * anteriores do job, permitindo retry automático), o job consulta a API do
 * gateway diretamente:
 *
 *   • "paid"    → move para `ativa`, restaura `users.plano`, grava evento
 *                 `gateway_confirmed_reactivation`.
 *   • "unpaid" / "unknown" → move para `expirada`, rebaixa `users.plano` para
 *                 `free`, grava evento `grace_period_expired`.
 *
 * Proteção contra race condition (webhook vs job):
 *   O UPDATE de assinaturas inclui `AND status = '...'` no WHERE.
 *   Se um `payment_succeeded` chegar entre o SELECT e o UPDATE e promover a
 *   assinatura para `ativa`, o UPDATE retornará 0 linhas e o job pula o
 *   rebaixo desse usuário — acesso não é removido indevidamente.
 *
 * Proteção contra falso-negativo em re-assinantes:
 *   Um usuário pode ter uma linha `inadimplente`/`pendente_reativacao` antiga e
 *   uma nova linha `ativa` (re-assinatura). Nesse caso o job expira a linha
 *   antiga mas NÃO toca `users.plano`.
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
    // ─── Fase 1: inadimplente → pendente_reativacao ────────────────────────
    const phase1Candidates = await db
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

    // Test seam: allow tests to inject a concurrent side-effect (e.g. a
    // payment_succeeded webhook) between the SELECT and the per-row UPDATEs.
    // Never called in production (no caller passes _testHooks).
    if (_testHooks?.onCandidatesSelected) {
      await _testHooks.onCandidatesSelected(phase1Candidates);
    }

    for (const row of phase1Candidates) {
      try {
        await db
          .update(assinaturas)
          .set({ status: "pendente_reativacao" })
          .where(
            and(
              eq(assinaturas.id, row.id),
              eq(assinaturas.status, "inadimplente"),
              lt(
                assinaturas.renovaEm,
                sql`NOW() - (${days} || ' days')::interval - (${buffer} || ' hours')::interval`,
              ),
            ),
          );
      } catch (rowErr) {
        console.error(
          `[downgrade-inadimplente] fase1: erro ao mover assinaturaId=${row.id} para pendente_reativacao:`,
          rowErr,
        );
      }
    }

    // ─── Fase 2: pendente_reativacao → ativa | expirada ───────────────────
    // Busca TODOS os pendente_reativacao (inclui runs anteriores — retry automático).
    const phase2Candidates = await db
      .select({
        id: assinaturas.id,
        userId: assinaturas.userId,
        gatewaySubscriptionId: assinaturas.gatewaySubscriptionId,
      })
      .from(assinaturas)
      .where(eq(assinaturas.status, "pendente_reativacao"));

    if (phase2Candidates.length === 0 && phase1Candidates.length === 0) {
      console.info(
        `[downgrade-inadimplente] runAt=${runAt} downgraded=0 reactivated=0 graceDays=${days} bufferHours=${buffer}`,
      );
      return { ok: true, downgraded: 0, reactivated: 0, runAt };
    }

    const gateway = getPaymentGateway();
    let downgraded = 0;
    let reactivated = 0;
    const downgradedIds: string[] = [];
    const reactivatedIds: string[] = [];

    for (const row of phase2Candidates) {
      try {
        // Consulta proativa ao gateway — segunda linha de defesa contra outages.
        let paymentStatus: "paid" | "unpaid" | "unknown" = "unknown";
        try {
          paymentStatus = await gateway.checkPaymentStatus(row.gatewaySubscriptionId);
        } catch (gwErr) {
          console.warn(
            `[downgrade-inadimplente] fase2: checkPaymentStatus falhou para assinaturaId=${row.id}:`,
            gwErr,
          );
          paymentStatus = "unknown";
        }

        if (paymentStatus === "paid") {
          // Gateway confirma pagamento — reativa a assinatura.
          await db.transaction(async (tx) => {
            const updated = await tx
              .update(assinaturas)
              .set({ status: "ativa" })
              .where(
                and(
                  eq(assinaturas.id, row.id),
                  eq(assinaturas.status, "pendente_reativacao"),
                ),
              )
              .returning({ id: assinaturas.id });

            if (updated.length === 0) return; // Race: webhook já reativou

            // Restaura users.plano se não há outra assinatura ativa.
            const activeRow = await tx
              .select({ id: assinaturas.id, planoId: assinaturas.planoId })
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
              // Busca o tier do plano para restaurar users.plano.
              const [assinaturaRow] = await tx
                .select({ planoId: assinaturas.planoId })
                .from(assinaturas)
                .where(eq(assinaturas.id, row.id))
                .limit(1);

              if (assinaturaRow) {
                const [planoRow] = await tx
                  .select({ tier: planos.tier })
                  .from(planos)
                  .where(eq(planos.id, assinaturaRow.planoId))
                  .limit(1);
                if (planoRow) {
                  await tx
                    .update(users)
                    .set({ plano: planoRow.tier, planoStartedAt: new Date() })
                    .where(eq(users.id, row.userId));
                }
              }
            }

            await tx.insert(assinaturaEventos).values({
              assinaturaId: row.id,
              tipo: "gateway_confirmed_reactivation",
              gatewayEventId: null,
              payloadJson: { graceDays: days, bufferHours: buffer, runAt, gatewayStatus: paymentStatus },
            });

            reactivated++;
            reactivatedIds.push(row.id);
            console.info(
              `[downgrade-inadimplente] reativada assinaturaId=${row.id} userId=${row.userId} (gateway=paid)`,
            );
          });
        } else {
          // "unpaid" ou "unknown" — comportamento conservador: expira a assinatura.
          await db.transaction(async (tx) => {
            const updated = await tx
              .update(assinaturas)
              .set({ status: "expirada" })
              .where(
                and(
                  eq(assinaturas.id, row.id),
                  eq(assinaturas.status, "pendente_reativacao"),
                ),
              )
              .returning({ id: assinaturas.id });

            if (updated.length === 0) return; // Race: webhook reativou no intervalo

            // Só rebaixa users.plano se o usuário não tem outra assinatura ativa.
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
              payloadJson: { graceDays: days, bufferHours: buffer, downgradedAt: runAt, gatewayStatus: paymentStatus },
            });

            downgraded++;
            downgradedIds.push(row.id);
            console.info(
              `[downgrade-inadimplente] expirada assinaturaId=${row.id} userId=${row.userId} graceDays=${days} bufferHours=${buffer} gateway=${paymentStatus}`,
            );
          });
        }
      } catch (rowErr) {
        console.error(
          `[downgrade-inadimplente] fase2: erro ao processar assinaturaId=${row.id}:`,
          rowErr,
        );
      }
    }

    if (downgraded > 0 || reactivated > 0) {
      try {
        await db.insert(auditLogs).values({
          actorId: null,
          action: "assinatura.grace-period-downgrade",
          targetUserId: null,
          payload: {
            downgraded,
            reactivated,
            graceDays: days,
            bufferHours: buffer,
            runAt,
            ids: downgradedIds,
            reactivatedIds,
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
      `[downgrade-inadimplente] runAt=${runAt} downgraded=${downgraded} reactivated=${reactivated} graceDays=${days} bufferHours=${buffer}`,
    );
    return { ok: true, downgraded, reactivated, runAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[downgrade-inadimplente] falha:", err);
    return { ok: false, downgraded: 0, reactivated: 0, runAt, error: message };
  }
}
