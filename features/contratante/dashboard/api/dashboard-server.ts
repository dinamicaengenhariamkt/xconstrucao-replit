import { and, eq, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { clientes, financeiro, obras } from '@shared/db/schema';
import { computeHealthSummaryForObras } from '@features/shared/health/summary-server';
import type { HealthSummaryData } from '@features/shared/health';
import type {
  ContratanteDashboardStats,
  EvolutionDataPoint,
  PhaseData,
  Pendencia,
  ValoresContratadosData,
} from '../types';

/**
 * Service SERVER-SIDE do dashboard do contratante (J17). Agrega obras +
 * financeiro do cliente autenticado direto no banco — substitui os mocks
 * `mockDashboardStatsByPeriodo`, `mockEvolutionDataByPeriodo`, `mockPhaseData`,
 * `mockValoresContratados` e `mockPendencias`.
 *
 * Escopo: tudo é filtrado por `clienteId`, resolvido a partir do `userId` do
 * token (clientes.userId é único). Um contratante só vê seus próprios números.
 *
 * Gaps honestos (registrados em docs/jornadas/17-dashboards-reais.md §13):
 *  - `obrasAtivasDelta` e `desvioPercentual` precisam de baseline histórico
 *    confiável — sem snapshots por período, retornam 0 (UI oculta o delta).
 *  - `percentualPrevisto` usa o progresso planejado pro-rata do prazo da obra
 *    como melhor proxy disponível.
 */

const PHASE_COLORS: Record<string, string> = {
  planejamento: '#f59e0b',
  em_andamento: '#8b5cf6',
  pausada: '#ef4444',
  concluida: '#22846D',
};

const PHASE_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em andamento',
  pausada: 'Pausada',
  concluida: 'Concluída',
};

/** Resolve o `clientes.id` do contratante a partir do `userId` do token. */
async function resolveClienteId(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.userId, userId))
    .limit(1);
  return row?.id ?? null;
}

export interface ContratanteDashboardPayload {
  stats: ContratanteDashboardStats;
  evolution: EvolutionDataPoint[];
  fases: PhaseData[];
  valoresContratados: ValoresContratadosData;
  pendencias: Pendencia[];
  healthSummary: HealthSummaryData;
}

const EMPTY_PAYLOAD: ContratanteDashboardPayload = {
  stats: {
    obrasAtivas: 0,
    obrasAtivasDelta: 0,
    percentualPrevisto: 0,
    percentualConcluido: 0,
    desvioPercentual: 0,
    obrasAtrasadas: 0,
    orcamentoTotal: 0,
    orcamentoExecutado: 0,
    desvioOrcamentoPercent: 0,
  },
  evolution: [],
  fases: [],
  valoresContratados: {
    totalContratado: 0,
    aditivos: 0,
    aditivosPercent: 0,
    executado: 0,
    aExecutar: 0,
    progressPercent: 0,
  },
  pendencias: [],
  healthSummary: { saudavel: 0, atencao: 0, risco: 0, total: 0 },
};

export async function getContratanteDashboard(
  userId: string,
): Promise<ContratanteDashboardPayload> {
  const clienteId = await resolveClienteId(userId);
  if (!clienteId) return EMPTY_PAYLOAD;

  // ── KPIs agregados das obras do cliente ─────────────────────────────────
  const [agg] = await db
    .select({
      obrasAtivas: sql<number>`COUNT(*) FILTER (WHERE ${obras.status} IN ('planejamento','em_andamento'))::int`,
      obrasAtrasadas: sql<number>`COUNT(*) FILTER (WHERE ${obras.status} = 'pausada')::int`,
      orcamentoTotal: sql<string>`COALESCE(SUM(${obras.valorTotal}), 0)`,
      orcamentoExecutado: sql<string>`COALESCE(SUM(${obras.valorPago}), 0)`,
      progMedio: sql<string>`COALESCE(AVG(${obras.progresso}) FILTER (WHERE ${obras.status} IN ('planejamento','em_andamento')), 0)`,
    })
    .from(obras)
    .where(eq(obras.clienteId, clienteId));

  const orcamentoTotal = Number(agg?.orcamentoTotal ?? 0);
  const orcamentoExecutado = Number(agg?.orcamentoExecutado ?? 0);
  const percentualConcluido = Math.round(Number(agg?.progMedio ?? 0));
  // Previsto pro-rata não tem fonte de cronograma confiável → usa o concluído
  // como referência (desvio 0) até existir baseline planejado. Ver §13.
  const percentualPrevisto = percentualConcluido;
  const desvioOrcamentoPercent =
    orcamentoTotal > 0
      ? Math.round(((orcamentoExecutado - orcamentoTotal * (percentualConcluido / 100)) / orcamentoTotal) * 100)
      : 0;

  const stats: ContratanteDashboardStats = {
    obrasAtivas: agg?.obrasAtivas ?? 0,
    obrasAtivasDelta: 0, // sem snapshot histórico — UI oculta (§13)
    percentualPrevisto,
    percentualConcluido,
    desvioPercentual: 0, // idem
    obrasAtrasadas: agg?.obrasAtrasadas ?? 0,
    orcamentoTotal,
    orcamentoExecutado,
    desvioOrcamentoPercent,
  };

  // ── Distribuição por fase (status da obra) ──────────────────────────────
  const faseRows = await db
    .select({
      status: obras.status,
      total: sql<number>`COUNT(*)::int`,
    })
    .from(obras)
    .where(eq(obras.clienteId, clienteId))
    .groupBy(obras.status);

  const fases: PhaseData[] = faseRows.map((r) => ({
    name: PHASE_LABELS[r.status] ?? r.status,
    value: r.total,
    color: PHASE_COLORS[r.status] ?? '#9ca3af',
  }));

  // ── Valores contratados (visão consolidada do portfólio) ────────────────
  const aExecutar = Math.max(0, orcamentoTotal - orcamentoExecutado);
  const valoresContratados: ValoresContratadosData = {
    totalContratado: orcamentoTotal,
    aditivos: 0, // não há tabela de aditivos — gap §13
    aditivosPercent: 0,
    executado: orcamentoExecutado,
    aExecutar,
    progressPercent: orcamentoTotal > 0 ? Math.round((orcamentoExecutado / orcamentoTotal) * 100) : 0,
  };

  // ── Evolução: pago acumulado por mês (proxy de "realizado") ──────────────
  const evolRows = await db
    .select({
      mes: sql<string>`to_char(${financeiro.data}::date, 'YYYY-MM')`,
      total: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
    })
    .from(financeiro)
    .innerJoin(obras, eq(obras.id, financeiro.obraId))
    .where(eq(obras.clienteId, clienteId))
    .groupBy(sql`to_char(${financeiro.data}::date, 'YYYY-MM')`)
    .orderBy(sql`to_char(${financeiro.data}::date, 'YYYY-MM')`);

  // Realizado = % do total contratado pago acumulado; planejado fica igual ao
  // realizado enquanto não há cronograma planejado (sem inventar curva).
  let acc = 0;
  const evolution: EvolutionDataPoint[] = evolRows.map((r) => {
    acc += Number(r.total);
    const pct = orcamentoTotal > 0 ? Math.round((acc / orcamentoTotal) * 100) : 0;
    const [, mm] = r.mes.split('-');
    return { mes: mm ?? r.mes, planejado: pct, realizado: pct };
  });

  // ── Pendências: lançamentos financeiros atrasados das obras do cliente ───
  const pendRows = await db
    .select({
      id: financeiro.id,
      descricao: financeiro.descricao,
      vencimento: financeiro.dataVencimento,
      data: financeiro.data,
      obraId: financeiro.obraId,
      obraNome: obras.nome,
    })
    .from(financeiro)
    .innerJoin(obras, eq(obras.id, financeiro.obraId))
    .where(and(eq(obras.clienteId, clienteId), sql`${financeiro.status} = 'atrasado'`))
    .orderBy(sql`COALESCE(${financeiro.dataVencimento}, ${financeiro.data}) ASC`)
    .limit(8);

  // ── Saúde consolidada (cálculo real, mesmo agregador das 3 personas) ─────
  const obraIdRows = await db
    .select({ id: obras.id })
    .from(obras)
    .where(eq(obras.clienteId, clienteId));
  const healthSummary = await computeHealthSummaryForObras(obraIdRows.map((o) => o.id));

  const today = new Date().toISOString().slice(0, 10);
  const pendencias: Pendencia[] = pendRows.map((r) => {
    const venc = r.vencimento ?? r.data;
    const diasMs = new Date(venc).getTime() - new Date(today).getTime();
    const dias = Math.round(diasMs / 86_400_000);
    const prazo = dias < 0 ? `Atrasado há ${Math.abs(dias)} dia(s)` : dias === 0 ? 'Vence hoje' : `Vence em ${dias} dia(s)`;
    const priority: Pendencia['priority'] = dias < 0 ? 'alta' : dias <= 7 ? 'media' : 'baixa';
    return {
      id: r.id,
      title: r.descricao,
      prazo,
      priority,
      obraId: r.obraId ?? '',
      obraNome: r.obraNome ?? '—',
    };
  });

  return { stats, evolution, fases, valoresContratados, pendencias, healthSummary };
}
