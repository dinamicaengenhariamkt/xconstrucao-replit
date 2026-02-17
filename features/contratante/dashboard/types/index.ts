/**
 * Types para o Dashboard do Contratante
 */

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
