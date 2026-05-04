import type {
  ContratanteDashboardStats,
  DashboardPeriodo,
  EvolutionDataPoint,
} from '../types';

/** Snapshot atual (default — equivale a 30 dias). */
export const mockDashboardStats: ContratanteDashboardStats = {
  obrasAtivas: 8,
  obrasAtivasDelta: 2,
  percentualPrevisto: 67,
  percentualConcluido: 58,
  desvioPercentual: -9,
  obrasAtrasadas: 2,
  orcamentoTotal: 4_200_000,
  orcamentoExecutado: 2_440_000,
  desvioOrcamentoPercent: -3,
};

/**
 * KPIs por período. Em produção viriam da API com filtro temporal;
 * aqui são valores pré-calculados que variam de forma plausível
 * (períodos mais longos somam mais obras concluídas e tendem a fechar mais o desvio).
 */
export const mockDashboardStatsByPeriodo: Record<DashboardPeriodo, ContratanteDashboardStats> = {
  '7dias': {
    obrasAtivas: 8,
    obrasAtivasDelta: 0,
    percentualPrevisto: 12,
    percentualConcluido: 9,
    desvioPercentual: -3,
    obrasAtrasadas: 1,
    orcamentoTotal: 4_200_000,
    orcamentoExecutado: 360_000,
    desvioOrcamentoPercent: -2,
  },
  '30dias': {
    obrasAtivas: 8,
    obrasAtivasDelta: 2,
    percentualPrevisto: 67,
    percentualConcluido: 58,
    desvioPercentual: -9,
    obrasAtrasadas: 2,
    orcamentoTotal: 4_200_000,
    orcamentoExecutado: 2_440_000,
    desvioOrcamentoPercent: -3,
  },
  '3meses': {
    obrasAtivas: 10,
    obrasAtivasDelta: 4,
    percentualPrevisto: 72,
    percentualConcluido: 65,
    desvioPercentual: -7,
    obrasAtrasadas: 3,
    orcamentoTotal: 5_800_000,
    orcamentoExecutado: 3_770_000,
    desvioOrcamentoPercent: -2,
  },
  '12meses': {
    obrasAtivas: 12,
    obrasAtivasDelta: 6,
    percentualPrevisto: 84,
    percentualConcluido: 79,
    desvioPercentual: -5,
    obrasAtrasadas: 4,
    orcamentoTotal: 8_500_000,
    orcamentoExecutado: 6_715_000,
    desvioOrcamentoPercent: 1,
  },
};

/**
 * Curva de evolução (planejado vs realizado) por período. Cada array
 * tem granularidade adequada ao recorte temporal:
 * 7d → dias; 30d → semanas; 3m/12m → meses.
 */
export const mockEvolutionDataByPeriodo: Record<DashboardPeriodo, EvolutionDataPoint[]> = {
  '7dias': [
    { mes: 'D-6', planejado: 2, realizado: 1 },
    { mes: 'D-5', planejado: 4, realizado: 3 },
    { mes: 'D-4', planejado: 6, realizado: 4 },
    { mes: 'D-3', planejado: 8, realizado: 6 },
    { mes: 'D-2', planejado: 10, realizado: 7 },
    { mes: 'D-1', planejado: 11, realizado: 8 },
    { mes: 'Hoje', planejado: 12, realizado: 9 },
  ],
  '30dias': [
    { mes: 'S-3', planejado: 18, realizado: 14 },
    { mes: 'S-2', planejado: 36, realizado: 28 },
    { mes: 'S-1', planejado: 54, realizado: 43 },
    { mes: 'Atual', planejado: 67, realizado: 58 },
  ],
  '3meses': [
    { mes: 'AGO', planejado: 68, realizado: 58 },
    { mes: 'SET', planejado: 75, realizado: 64 },
    { mes: 'OUT', planejado: 82, realizado: 71 },
    { mes: 'NOV', planejado: 88, realizado: 78 },
  ],
  '12meses': [
    { mes: 'JAN', planejado: 10, realizado: 8 },
    { mes: 'FEV', planejado: 20, realizado: 16 },
    { mes: 'MAR', planejado: 28, realizado: 23 },
    { mes: 'ABR', planejado: 36, realizado: 30 },
    { mes: 'MAI', planejado: 44, realizado: 37 },
    { mes: 'JUN', planejado: 52, realizado: 44 },
    { mes: 'JUL', planejado: 60, realizado: 51 },
    { mes: 'AGO', planejado: 68, realizado: 58 },
    { mes: 'SET', planejado: 75, realizado: 64 },
    { mes: 'OUT', planejado: 82, realizado: 71 },
  ],
};
