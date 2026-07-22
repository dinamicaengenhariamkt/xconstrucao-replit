import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { getPayment } from "@shared/lib/asaas-client";
import { aplicarEventoSplit } from "./aplicar-evento-split";
import { isMarketplaceSplitEnabled } from "./flags";

/**
 * J50 — Reconciliação de split. Protege contra webhooks de pagamento de obra
 * perdidos: varre `pagamentos_split` presos em `pendente` (com `asaas_payment_id`)
 * criados há mais de RECONCILE_MIN_AGE_MIN, consulta o status real no Asaas e,
 * se confirmado, reaplica `aplicarEventoSplit` (idempotente por transição de
 * status — nunca duplica `financeiro`).
 *
 * Disparo: periódico (scripts/reconciliar-split.ts, Replit Scheduled Deployment)
 * ou manual (POST /api/admin/marketplace/reconciliar).
 */

// Só reconcilia splits pendentes há tempo suficiente para o webhook normal ter
// chegado (evita corrida com a confirmação em tempo real).
export const RECONCILE_MIN_AGE_MIN = 15;
export const RECONCILE_WINDOW_HOURS = 72;

export interface ReconciliacaoResult {
  ok: boolean;
  verificados: number;
  recuperados: number;
  falhas: number;
  runAt: string;
  error?: string;
}

export async function reconciliarSplitsPendentes(limit = 50): Promise<ReconciliacaoResult> {
  const runAt = new Date().toISOString();

  if (!isMarketplaceSplitEnabled()) {
    return { ok: true, verificados: 0, recuperados: 0, falhas: 0, runAt };
  }

  try {
    const candidateResult = await db.execute<{ id: string; asaas_payment_id: string }>(sql`
      SELECT id, asaas_payment_id
        FROM pagamentos_split
       WHERE status = 'pendente'
         AND asaas_payment_id IS NOT NULL
         AND created_at < NOW() - INTERVAL '${sql.raw(String(RECONCILE_MIN_AGE_MIN))} minutes'
         AND created_at > NOW() - INTERVAL '${sql.raw(String(RECONCILE_WINDOW_HOURS))} hours'
       ORDER BY created_at ASC
       LIMIT ${limit}
    `);
    const candidates = candidateResult.rows as { id: string; asaas_payment_id: string }[];

    let recuperados = 0;
    let falhas = 0;

    for (const row of candidates) {
      try {
        const payment = await getPayment(row.asaas_payment_id);
        const pago = payment.status === "CONFIRMED" || payment.status === "RECEIVED";
        const falhou =
          payment.status === "REFUNDED" ||
          payment.status === "REFUND_REQUESTED" ||
          payment.status === "CHARGEBACK_REQUESTED" ||
          payment.status === "DELETED";

        if (pago) {
          // Recuperação idempotente: aplicarEventoSplit só age se ainda pendente.
          const res = await aplicarEventoSplit({
            eventId: `reconciliacao:${row.asaas_payment_id}`,
            type: "payment_succeeded",
            asaasPaymentId: row.asaas_payment_id,
          });
          if (res.processed) recuperados++;
        } else if (falhou) {
          await aplicarEventoSplit({
            eventId: `reconciliacao:${row.asaas_payment_id}`,
            type: "payment_failed",
            asaasPaymentId: row.asaas_payment_id,
          });
        }
        // Demais status (PENDING/OVERDUE/AWAITING) → segue pendente, sem ação.
      } catch (err) {
        console.warn(`[reconciliacao-split] falha ao verificar split ${row.id}:`, err);
        falhas++;
      }
    }

    console.info(
      `[reconciliacao-split] verificados=${candidates.length} recuperados=${recuperados} falhas=${falhas}`,
    );
    return { ok: true, verificados: candidates.length, recuperados, falhas, runAt };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[reconciliacao-split] erro geral:", error);
    return { ok: false, verificados: 0, recuperados: 0, falhas: 0, runAt, error };
  }
}
