import { and, inArray, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { financeiro } from '@shared/db/schema';
import { computeProfitFromObra } from './compute-from-obra';
import type { ProfitMetrics, ProfitSummaryData, ProfitTrendPoint } from './types';

/**
 * Agregador SERVER-SIDE do lucro consolidado de um conjunto de obras (J17).
 * Substitui `getMockProfitSummary` por dados reais de `financeiro`:
 *  - receitaTotal: entradas pagas das obras.
 *  - custoTotal: saídas pagas das obras.
 *  - margem: derivada (lucro/receita).
 *
 * Gap honesto (§13): "custos próprios" do empreiteiro raramente são lançados
 * hoje, então `custoTotal` tende a refletir só repasses — a margem pode aparecer
 * alta. É a realidade do dado, não estimativa inventada (ver compute-from-obra).
 */
export async function computeProfitSummaryForObras(
  obraIds: string[],
): Promise<ProfitSummaryData> {
  const empty: ProfitMetrics = { receitaTotal: 0, custoTotal: 0, lucroEstimado: 0, margem: 0 };
  if (obraIds.length === 0) {
    return { metrics: empty, trend: [], totalObras: 0 };
  }

  const [agg] = await db
    .select({
      receita: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      custo: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago'), 0)`,
    })
    .from(financeiro)
    .where(inArray(financeiro.obraId, obraIds));

  const metrics = computeProfitFromObra({
    financeiro: { receitaTotal: Number(agg?.receita ?? 0), custoTotal: Number(agg?.custo ?? 0) },
  });

  // Trend: lucro/margem por mês (entrada - saída paga), ordem cronológica.
  const trendRows = await db
    .select({
      mes: sql<string>`to_char(${financeiro.data}::date, 'YYYY-MM')`,
      receita: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      custo: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago'), 0)`,
    })
    .from(financeiro)
    .where(and(inArray(financeiro.obraId, obraIds)))
    .groupBy(sql`to_char(${financeiro.data}::date, 'YYYY-MM')`)
    .orderBy(sql`to_char(${financeiro.data}::date, 'YYYY-MM')`);

  const trend: ProfitTrendPoint[] = trendRows.slice(-6).map((r) => {
    const receita = Number(r.receita);
    const lucro = receita - Number(r.custo);
    const margem = receita > 0 ? Number(((lucro / receita) * 100).toFixed(1)) : 0;
    const [, mm] = r.mes.split('-');
    return { mes: mm ?? r.mes, lucro, margem };
  });

  return { metrics, trend, totalObras: obraIds.length };
}
