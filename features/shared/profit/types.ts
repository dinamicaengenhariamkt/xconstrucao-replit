export interface ProfitMetrics {
  receitaTotal: number;
  custoTotal: number;
  lucroEstimado: number;
  margem: number;
}

export interface ProfitTrendPoint {
  mes: string;
  lucro: number;
  margem: number;
}

export interface ProfitSummaryData {
  metrics: ProfitMetrics;
  trend: ProfitTrendPoint[];
  totalObras: number;
}

export type MarginVariant = 'success' | 'warning' | 'error';
