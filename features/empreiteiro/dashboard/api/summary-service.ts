/**
 * Service client-side do resumo de saúde/lucro do dashboard do empreiteiro (J17).
 * Busca o cálculo real agregado pelo endpoint `/api/empreiteiro/dashboard/summary`.
 */

import type { HealthSummaryData } from '@features/shared/health';
import type { ProfitSummaryData } from '@features/shared/profit';

export interface EmpreiteiroSummary {
  health: HealthSummaryData;
  profit: ProfitSummaryData;
}

export async function getEmpreiteiroSummary(): Promise<EmpreiteiroSummary> {
  const response = await fetch('/api/empreiteiro/dashboard/summary');
  if (!response.ok) {
    throw new Error('Erro ao buscar resumo de saúde/lucro');
  }
  return response.json();
}
