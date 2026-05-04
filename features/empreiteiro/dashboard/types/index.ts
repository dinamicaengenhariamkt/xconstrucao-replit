/**
 * Types para o Dashboard do Empreiteiro
 */

import type { IconType } from 'react-icons';
import type { HealthSummaryData } from '@features/shared/health';

export type { DashboardPeriodo } from '@features/shared/dashboard/types';

// ---------------------------------------------------------------------------
// Domain types
// ---------------------------------------------------------------------------

export type PendenciaPriority = 'alta' | 'media' | 'baixa';

export interface EmpreiteiroPendencia {
  id: string;
  title: string;
  prazo: string;
  priority: PendenciaPriority;
  obraId: string;
  obraNome: string;
}

export interface ObrasStatusDatum {
  name: string;
  value: number;
  color: string;
  /** Status correspondente em /empreiteiro/minhas-obras (para deep-link). */
  status?: string;
}

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
  data: DashboardStats;
  healthSummary?: HealthSummaryData;
}

export interface FinancialOverviewProps {
  data: FinancialOverview;
}

export interface CashFlowChartProps {
  data: CashFlowData[];
}

export interface RecentActivitiesProps {
  activities: Activity[];
}

export interface PendenciasCardProps {
  pendencias: EmpreiteiroPendencia[];
}

export interface ObrasStatusChartProps {
  data: ObrasStatusDatum[];
  totalObras?: number;
}

export interface ObrasStatusChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: ObrasStatusDatum }>;
}

export interface ActivityItemProps {
  activity: Activity;
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
