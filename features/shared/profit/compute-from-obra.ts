import type { ProfitMetrics } from './types';

/**
 * Calcula métricas de lucro a partir de receita e custo reais.
 *
 * `receitaTotal` é a soma de entradas (lançamentos pagos onde o
 * empreiteiro é recebedor). `custoTotal` é a soma de saídas (lançamentos
 * pagos onde o empreiteiro é pagador — materiais, mão de obra,
 * equipamentos). Não há mais estimativa de 65% — quando não há custos
 * lançados, `custoTotal` é 0 e a margem aparece como 100% (o que reflete
 * a realidade: nada foi gasto ainda).
 */
export interface ProfitObraInput {
  financeiro: { receitaTotal: number; custoTotal: number };
}

export function computeProfitFromObra(obra: ProfitObraInput): ProfitMetrics {
  const receitaTotal = Math.round(obra.financeiro.receitaTotal || 0);
  const custoTotal = Math.round(obra.financeiro.custoTotal || 0);
  const lucroEstimado = receitaTotal - custoTotal;
  const margem = receitaTotal > 0 ? Number(((lucroEstimado / receitaTotal) * 100).toFixed(1)) : 0;
  return { receitaTotal, custoTotal, lucroEstimado, margem };
}
