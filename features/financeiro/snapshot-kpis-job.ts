import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { kpiSnapshots } from "@shared/db/schema";

export interface SnapshotKpisResult {
  ok: boolean;
  inserted: number;
  periodo: string;
  error?: string;
}

/**
 * Job idempotente (J29) — materializa uma fotografia diária das métricas-chave
 * em `kpi_snapshots`. O índice único (metrica, periodo) + `ON CONFLICT DO NOTHING`
 * garantem 1 snapshot por métrica por dia (rodar 2x no mesmo dia é inócuo).
 *
 * Roda no boot (instrumentation.ts). Quando houver ≥2 dias de histórico, os
 * dashboards (J17/J18) passam a calcular deltas reais a partir desta série.
 *
 * Conjunto enxuto no MVP — métricas baratas que destravam delta visível:
 *  - usuariosAtivos: COUNT(users WHERE ativo)
 *  - volumeContratado: SUM(obras.valor_total)
 *  - taxasPlataforma: SUM(financeiro.valor) entrada/plataforma/paga
 */
export async function snapshotKpisJob(): Promise<SnapshotKpisResult> {
  const periodo = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  try {
    const [row] = await db.execute<{
      usuarios_ativos: number;
      volume_contratado: number;
      taxas_plataforma: number;
    }>(sql`
      SELECT
        (SELECT COUNT(*) FROM users WHERE ativo = true)::numeric AS usuarios_ativos,
        (SELECT COALESCE(SUM(valor_total), 0) FROM obras)::numeric AS volume_contratado,
        (SELECT COALESCE(SUM(valor), 0) FROM financeiro
           WHERE tipo = 'entrada' AND escopo = 'plataforma' AND status = 'pago')::numeric AS taxas_plataforma
    `).then((r: any) => (Array.isArray(r?.rows) ? r.rows : r));

    const metricas: Array<{ metrica: string; valor: string }> = [
      { metrica: "usuariosAtivos", valor: String(row?.usuarios_ativos ?? 0) },
      { metrica: "volumeContratado", valor: String(row?.volume_contratado ?? 0) },
      { metrica: "taxasPlataforma", valor: String(row?.taxas_plataforma ?? 0) },
    ];

    const result = await db
      .insert(kpiSnapshots)
      .values(metricas.map((m) => ({ metrica: m.metrica, valor: m.valor, periodo })))
      .onConflictDoNothing({ target: [kpiSnapshots.metrica, kpiSnapshots.periodo] })
      .returning({ id: kpiSnapshots.id });

    const inserted = result.length;
    console.info(`[snapshot-kpis] periodo=${periodo} inserted=${inserted}`);
    return { ok: true, inserted, periodo };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[snapshot-kpis] falha:", err);
    return { ok: false, inserted: 0, periodo, error: message };
  }
}
