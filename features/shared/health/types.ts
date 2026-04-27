export type HealthStatus = 'saudavel' | 'atencao' | 'risco';

export type HealthFactorKey = 'atraso' | 'financeiro' | 'tarefas';

export interface HealthFactors {
  atraso: number;
  financeiro: number;
  tarefas: number;
}

export interface HealthReason {
  fator: HealthFactorKey;
  mensagem: string;
  severidade: HealthStatus;
}

export interface HealthTrendPoint {
  date: string;
  score: number;
}

export type HealthDrivers = Record<HealthFactorKey, string[]>;

export interface ObraHealth {
  status: HealthStatus;
  score: number;
  factors: HealthFactors;
  reasons: HealthReason[];
  updatedAt: string;
  drivers?: HealthDrivers;
  trend?: HealthTrendPoint[];
  recommendations?: string[];
}

export interface HealthSummaryData {
  saudavel: number;
  atencao: number;
  risco: number;
  total: number;
}
