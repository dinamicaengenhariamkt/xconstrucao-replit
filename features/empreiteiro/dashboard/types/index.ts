/**
 * Types para o Dashboard do Empreiteiro
 */

import type { IconType } from 'react-icons';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  obrasAtivas: number;
  obrasAtivasDelta: number;
  obrasConcluidas: number;
  obrasConcluidasPeriodo: string;
  valorRecebido: number;
  valorRecebidoDelta: number;
  valorGasto: number;
  valorGastoPeriodo: string;
}

export interface FinancialOverview {
  margemLucro: number;
  margemLucroTrend: 'up' | 'down' | 'neutral';
  ticketMedio: number;
  ticketMedioDelta: number;
  taxaConclusao: number;
  taxaConclusaoDelta: number;
  fluxoCaixa: CashFlowData[];
}

export interface CashFlowData {
  mes: string;
  receitas: number;
  despesas: number;
}

export type ActivityType = 'payment' | 'milestone' | 'delivery' | 'contract' | 'alert';

export interface Activity {
  id: string;
  type: ActivityType;
  icon: string;
  color: 'success' | 'info' | 'warning' | 'primary' | 'amber';
  title: string;
  description: string;
  timestamp: Date;
  obraId?: string;
  obraNome?: string;
}

export interface EfficiencyData {
  percentage: number;
  label: string;
  period: string;
}

// ---------------------------------------------------------------------------
// Component prop types
// ---------------------------------------------------------------------------

export interface StatsCardData {
  label: string;
  value: string | number;
  icon: IconType;
  iconBgColor: string;
  badge?: {
    label: string;
    variant: 'success' | 'neutral';
  };
}

export type StatsCardProps = StatsCardData;

/** Props da apresentação pura (recebe stats já montados) */
export interface StatsGridProps {
  stats: StatsCardData[];
}

/** Props do container (recebe dados brutos do domínio) */
export interface StatsGridContainerProps {
  data: DashboardStats;
}

export interface FinancialOverviewProps {
  data: FinancialOverview;
}

export interface CashFlowChartProps {
  data: CashFlowData[];
}

export interface RecentActivitiesProps {
  activities: Activity[];
  efficiency: EfficiencyData;
}

export interface ActivityItemProps {
  activity: Activity;
}

export interface EfficiencyProgressProps {
  percentage: number;
  label: string;
}

export interface FinancialMiniCardProps {
  label: string;
  value: number;
  format: 'percentage' | 'currency' | 'number';
  color: 'success' | 'info' | 'primary';
  trend?: 'up' | 'down' | 'neutral';
  delta?: number;
}

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

export interface EmptyStateProps {
  icon: IconType;
  title: string;
  description: string;
  action?: EmptyStateAction;
}
