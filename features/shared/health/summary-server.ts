import { inArray, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { obras } from '@shared/db/schema';
import { computeHealthFromObra } from './compute-from-obra';
import type { HealthSummaryData, ObraHealth } from './types';

/**
 * Calcula a saúde REAL de cada obra de um conjunto (J17), retornando um mapa
 * `obraId → ObraHealth`. Fonte única usada pelo summary e pelos filtros/cards
 * de saúde das listas de obra — substitui `getMockHealth`/`getMockHealthSummary`.
 *
 * Campos do cálculo (`computeHealthFromObra`):
 *  - progresso / valorTotal / valorPago / updatedAt: da própria `obras`.
 *  - diasAtraso: derivado de `dataPrevisao` vs hoje (0 se concluída ou sem prazo).
 *  - tarefasPendentes / tarefasTotal: de `obra_tarefas`.
 *  - problemasAbertos: ocorrências com status 'aberta' em `obra_ocorrencias`.
 */
export async function computeHealthMapForObras(
  obraIds: string[],
): Promise<Record<string, ObraHealth>> {
  if (obraIds.length === 0) return {};

  const rows = await db
    .select({
      id: obras.id,
      status: obras.status,
      progresso: obras.progresso,
      valorTotal: obras.valorTotal,
      valorPago: obras.valorPago,
      dataPrevisao: obras.dataPrevisao,
      updatedAt: obras.updatedAt,
      tarefasTotal: sql<number>`COALESCE((SELECT COUNT(*) FROM obra_tarefas t WHERE t.obra_id = ${obras.id}), 0)::int`,
      tarefasPendentes: sql<number>`COALESCE((SELECT COUNT(*) FROM obra_tarefas t WHERE t.obra_id = ${obras.id} AND t.status <> 'concluido'), 0)::int`,
      problemasAbertos: sql<number>`COALESCE((SELECT COUNT(*) FROM obra_ocorrencias o WHERE o.obra_id = ${obras.id} AND o.status = 'aberta'), 0)::int`,
    })
    .from(obras)
    .where(inArray(obras.id, obraIds));

  const today = new Date();
  const map: Record<string, ObraHealth> = {};
  for (const r of rows) {
    const valorTotal = Number(r.valorTotal ?? 0);
    const valorPago = Number(r.valorPago ?? 0);
    const diasAtraso =
      r.status !== 'concluida' && r.dataPrevisao
        ? Math.max(0, Math.round((today.getTime() - new Date(r.dataPrevisao).getTime()) / 86_400_000))
        : 0;

    map[r.id] = computeHealthFromObra({
      progresso: r.progresso ?? 0,
      diasAtraso,
      problemasAbertos: r.problemasAbertos,
      tarefasPendentes: r.tarefasPendentes,
      tarefasTotal: r.tarefasTotal,
      financeiro: { valorContratado: valorTotal, valorTotal, saldoReceber: Math.max(0, valorTotal - valorPago) },
      valorPago,
      updatedAt: r.updatedAt,
    });
  }
  return map;
}

/** Agrega o mapa de saúde num resumo (saudável/atenção/risco/total). */
export function summarizeHealthMap(map: Record<string, ObraHealth>): HealthSummaryData {
  const values = Object.values(map);
  const summary: HealthSummaryData = { saudavel: 0, atencao: 0, risco: 0, total: values.length };
  for (const h of values) summary[h.status] += 1;
  return summary;
}

/** Atalho: resumo de saúde de um conjunto de obras (calcula o mapa e agrega). */
export async function computeHealthSummaryForObras(
  obraIds: string[],
): Promise<HealthSummaryData> {
  const map = await computeHealthMapForObras(obraIds);
  return summarizeHealthMap(map);
}
