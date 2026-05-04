/**
 * Types para o Dashboard do Contratante
 */


// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type { DashboardPeriodo } from '@features/shared/dashboard/types';

export interface ContratanteDashboardStats {
  obrasAtivas: number;
  obrasAtivasDelta: number;
  percentualPrevisto: number;
  percentualConcluido: number;
  desvioPercentual: number;
  obrasAtrasadas: number;
  /** Soma de `valorContratado + aditivos` agregada das obras no período. */
  orcamentoTotal: number;
  /** Soma de `valorPago` agregada das obras no período. */
  orcamentoExecutado: number;
  /** Desvio entre executado e o esperado-pro-rata para o período (positivo = acima do plano). */
  desvioOrcamentoPercent: number;
}

export interface EvolutionDataPoint {
  mes: string;
  planejado: number;
  realizado: number;
}

export interface PhaseData {
  name: string;
  value: number;
  color: string;
}

export type ActivityColor = 'success' | 'info' | 'warning' | 'purple';

export interface ContratanteActivity {
  id: string;
  icon: string;
  color: ActivityColor;
  title: string;
  obraId: string;
  obraNome: string;
  timestamp: string;
}

export type PendenciaPriority = 'alta' | 'media' | 'baixa';

export interface Pendencia {
  id: string;
  title: string;
  prazo: string;
  priority: PendenciaPriority;
  obraId: string;
  obraNome: string;
}

export interface ValoresContratadosData {
  totalContratado: number;
  aditivos: number;
  aditivosPercent: number;
  executado: number;
  aExecutar: number;
  progressPercent: number;
}

// ---------------------------------------------------------------------------
// Component prop types
// ---------------------------------------------------------------------------

export type {
  StatsCardBadge,
  StatsCardBadgeVariant,
  StatsCardData,
  StatsCardProps,
} from '@features/shared/components/StatsCard';

import type { StatsCardData } from '@features/shared/components/StatsCard';

/** Props da apresentação pura (recebe stats já montados) */
export interface StatsGridProps {
  stats: StatsCardData[];
}

/** Props do container (recebe dados brutos do domínio) */
export interface StatsGridContainerProps {
  data: ContratanteDashboardStats;
}

export interface EvolutionChartProps {
  data: EvolutionDataPoint[];
}

export interface PhaseDistributionChartProps {
  data: PhaseData[];
  totalObras?: number;
}

export interface PhaseDistributionChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: PhaseData }>;
}

export interface RecentActivitiesCardProps {
  activities: ContratanteActivity[];
}

export interface PendenciasCardProps {
  pendencias: Pendencia[];
}

export interface ValoresContratadosProps {
  data: ValoresContratadosData;
}
