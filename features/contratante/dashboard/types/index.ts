/**
 * Types para o Dashboard do Contratante
 */

import type { IconType } from 'react-icons';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface ContratanteDashboardStats {
  obrasAtivas: number;
  obrasAtivasDelta: number;
  percentualPrevisto: number;
  percentualConcluido: number;
  desvioPercentual: number;
  obrasAtrasadas: number;
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
  obraNome: string;
  timestamp: string;
}

export type PendenciaPriority = 'alta' | 'media' | 'baixa';

export interface Pendencia {
  id: string;
  title: string;
  prazo: string;
  priority: PendenciaPriority;
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

export type StatsCardBadgeVariant = 'success' | 'neutral' | 'blue' | 'amber' | 'red';

export interface StatsCardData {
  label: string;
  value: string | number;
  icon: IconType;
  iconBgColor: string;
  badge?: {
    label: string;
    variant: StatsCardBadgeVariant;
  };
}

export type StatsCardProps = StatsCardData;

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
