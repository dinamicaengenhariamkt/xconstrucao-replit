/**
 * Types para o Dashboard do Empreiteiro
 */

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

export interface StatsCardData {
  label: string;
  value: number;
  icon: string;
  badge?: {
    label: string;
    variant: 'success' | 'neutral';
  };
  iconBgColor: string;
}
