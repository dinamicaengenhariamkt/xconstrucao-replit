import type { ProfitMetrics } from './types';

/**
 * Calcula métricas de lucro a partir do bloco financeiro real da obra.
 * Custo estimado conservador: 65% da receita executada (placeholder até
 * J08 entregar custo real por obra).
 */
export interface ProfitObraInput {
  financeiro: { valorTotal: number; valorContratado: number; percentualExecutado: number };
  valorPago?: number;
}

const COST_RATIO = 0.65;

export function computeProfitFromObra(obra: ProfitObraInput): ProfitMetrics {
  const receitaTotal = Math.round(obra.financeiro.valorTotal || obra.financeiro.valorContratado || 0);
  const custoTotal = Math.round(receitaTotal * COST_RATIO);
  const lucroEstimado = receitaTotal - custoTotal;
  const margem = receitaTotal > 0 ? Number(((lucroEstimado / receitaTotal) * 100).toFixed(1)) : 0;
  return { receitaTotal, custoTotal, lucroEstimado, margem };
}
