import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { auditLogs, financeiro } from "@shared/db/schema";

export interface MarkOverdueResult {
  ok: boolean;
  updated: number;
  runAt: string;
  error?: string;
}

/**
 * Job idempotente — promove lançamentos `pendente` cuja data_vencimento já
 * passou para `atrasado`. Pensado para rodar diariamente via Replit
 * Scheduled Deployment (`scripts/mark-overdue-pagamentos.ts`) e também na
 * inicialização do server (instrumentation.ts), garantindo que o empreiteiro
 * veja o mesmo status que o contratante.
 *
 * Critério SQL: status='pendente' AND data_vencimento < CURRENT_DATE
 * (data_vencimento é TEXT no formato ISO `YYYY-MM-DD`, então comparação
 *  lexicográfica equivale a comparação cronológica.)
 */
export async function markOverduePagamentos(): Promise<MarkOverdueResult> {
  const runAt = new Date().toISOString();
  try {
    const today = runAt.slice(0, 10);
    const rows = await db
      .update(financeiro)
      .set({ status: "atrasado" })
      .where(
        and(
          eq(financeiro.status, "pendente"),
          sql`${financeiro.dataVencimento} IS NOT NULL`,
          lt(financeiro.dataVencimento, today),
        ),
      )
      .returning({ id: financeiro.id });

    const updated = rows.length;

    if (updated > 0) {
      try {
        await db.insert(auditLogs).values({
          actorId: null,
          action: "financeiro.mark-overdue",
          targetUserId: null,
          payload: { updated, today, ids: rows.map((r) => r.id) },
          ip: "cron",
          userAgent: "mark-overdue-job",
        });
      } catch (auditErr) {
        console.error("[mark-overdue] falha ao gravar audit log:", auditErr);
      }
    }

    console.info(`[mark-overdue] runAt=${runAt} updated=${updated}`);
    return { ok: true, updated, runAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[mark-overdue] falha:", err);
    return { ok: false, updated: 0, runAt, error: message };
  }
}
