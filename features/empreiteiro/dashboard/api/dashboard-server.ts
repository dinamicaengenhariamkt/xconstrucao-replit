import { eq, inArray, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, financeiro, obras } from '@shared/db/schema';
import { computeHealthSummaryForObras } from '@features/shared/health/summary-server';
import { computeProfitSummaryForObras } from '@features/shared/profit/summary-server';
import type { HealthSummaryData } from '@features/shared/health';
import type { ProfitSummaryData } from '@features/shared/profit';
import { resolverIntervalo } from '@features/admin/financeiro/api/caixa-service';
import type { DashboardPeriodo, DashboardStats, FinancialOverview } from '../types';

/**
 * Service SERVER-SIDE do dashboard do empreiteiro (J17). Agrega obras +
 * financeiro das obras atribuídas à empreiteira do usuário (via
 * `empreiteiras.userId` → `obras.empreiteiraId`). Substitui os mocks
 * `mockDashboardStatsByPeriodo` / `mockFinancialOverviewByPeriodo` e os
 * `getMockHealthSummary` / `getMockProfitSummary`.
 */

function periodoLabel(periodo: DashboardPeriodo): string {
  switch (periodo) {
    case '7dias':
      return 'Últimos 7 dias';
    case '30dias':
      return 'Últimos 30 dias';
    case '3meses':
      return 'Últimos 3 meses';
    case '12meses':
      return 'Últimos 12 meses';
    default:
      return 'No período';
  }
}

/** Resolve os ids das obras da empreiteira do usuário. */
async function resolveObraIds(userId: string): Promise<string[]> {
  const [emp] = await db
    .select({ id: empreiteiras.id })
    .from(empreiteiras)
    .where(eq(empreiteiras.userId, userId))
    .limit(1);
  if (!emp) return [];
  const rows = await db
    .select({ id: obras.id })
    .from(obras)
    .where(eq(obras.empreiteiraId, emp.id));
  return rows.map((r) => r.id);
}

export async function getEmpreiteiroDashboardStats(
  userId: string,
  periodo: DashboardPeriodo,
): Promise<DashboardStats> {
  const obraIds = await resolveObraIds(userId);
  const empty: DashboardStats = {
    obrasAtivas: 0,
    obrasAtivasDelta: 0,
    obrasConcluidas: 0,
    obrasConcluidasPeriodo: periodoLabel(periodo),
    valorRecebido: 0,
    valorRecebidoDelta: 0,
    valorGasto: 0,
    valorGastoPeriodo: periodoLabel(periodo),
  };
  if (obraIds.length === 0) return empty;

  const [obraAgg] = await db
    .select({
      ativas: sql<number>`COUNT(*) FILTER (WHERE ${obras.status} IN ('planejamento','em_andamento'))::int`,
      concluidas: sql<number>`COUNT(*) FILTER (WHERE ${obras.status} = 'concluida')::int`,
    })
    .from(obras)
    .where(inArray(obras.id, obraIds));

  const intervalo = resolverIntervalo(periodo, Date.now());
  const dataCond = intervalo.inicio
    ? sql`${financeiro.data} >= ${intervalo.inicio} AND ${financeiro.data} <= ${intervalo.fim}`
    : sql`true`;

  const [finAgg] = await db
    .select({
      recebido: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago' AND ${dataCond}), 0)`,
      gasto: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago' AND ${dataCond}), 0)`,
    })
    .from(financeiro)
    .where(inArray(financeiro.obraId, obraIds));

  return {
    obrasAtivas: obraAgg?.ativas ?? 0,
    obrasAtivasDelta: 0, // sem snapshot histórico — UI oculta (§13)
    obrasConcluidas: obraAgg?.concluidas ?? 0,
    obrasConcluidasPeriodo: periodoLabel(periodo),
    valorRecebido: Number(finAgg?.recebido ?? 0),
    valorRecebidoDelta: 0,
    valorGasto: Number(finAgg?.gasto ?? 0),
    valorGastoPeriodo: periodoLabel(periodo),
  };
}

export async function getEmpreiteiroFinancial(
  userId: string,
  periodo: DashboardPeriodo,
): Promise<FinancialOverview> {
  const obraIds = await resolveObraIds(userId);
  const empty: FinancialOverview = {
    margemLucro: 0,
    margemLucroTrend: 'neutral',
    ticketMedio: 0,
    ticketMedioDelta: 0,
    taxaConclusao: 0,
    taxaConclusaoDelta: 0,
    fluxoCaixa: [],
  };
  if (obraIds.length === 0) return empty;

  const profit = await computeProfitSummaryForObras(obraIds);

  // Ticket médio = receita total / nº de obras com receita.
  const ticketMedio = obraIds.length > 0 ? Math.round(profit.metrics.receitaTotal / obraIds.length) : 0;

  const [obraAgg] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      concluidas: sql<number>`COUNT(*) FILTER (WHERE ${obras.status} = 'concluida')::int`,
    })
    .from(obras)
    .where(inArray(obras.id, obraIds));
  const taxaConclusao =
    (obraAgg?.total ?? 0) > 0 ? Math.round(((obraAgg?.concluidas ?? 0) / (obraAgg?.total ?? 1)) * 100) : 0;

  // Fluxo de caixa por mês (entradas/saídas pagas), últimos 6 meses.
  const fluxoRows = await db
    .select({
      mes: sql<string>`to_char(${financeiro.data}::date, 'YYYY-MM')`,
      receitas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      despesas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago'), 0)`,
    })
    .from(financeiro)
    .where(inArray(financeiro.obraId, obraIds))
    .groupBy(sql`to_char(${financeiro.data}::date, 'YYYY-MM')`)
    .orderBy(sql`to_char(${financeiro.data}::date, 'YYYY-MM')`);

  const fluxoCaixa = fluxoRows.slice(-6).map((r) => {
    const [, mm] = r.mes.split('-');
    return { mes: mm ?? r.mes, receitas: Number(r.receitas), despesas: Number(r.despesas) };
  });

  return {
    margemLucro: profit.metrics.margem,
    margemLucroTrend: profit.metrics.margem >= 0 ? 'up' : 'down',
    ticketMedio,
    ticketMedioDelta: 0,
    taxaConclusao,
    taxaConclusaoDelta: 0,
    fluxoCaixa,
  };
}

export async function getEmpreiteiroHealthSummary(userId: string): Promise<HealthSummaryData> {
  const obraIds = await resolveObraIds(userId);
  return computeHealthSummaryForObras(obraIds);
}

export async function getEmpreiteiroProfitSummary(userId: string): Promise<ProfitSummaryData> {
  const obraIds = await resolveObraIds(userId);
  return computeProfitSummaryForObras(obraIds);
}
