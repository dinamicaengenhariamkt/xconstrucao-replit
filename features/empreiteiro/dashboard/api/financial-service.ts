/**
 * Service para buscar dados financeiros
 */

import { ENABLE_MOCK } from '../constants';
import { mockFinancialOverviewByPeriodo } from '../mocks/financial-data.mock';
import type { DashboardPeriodo, FinancialOverview } from '../types';

export async function getFinancialData(
  periodo: DashboardPeriodo = '12meses',
): Promise<FinancialOverview> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockFinancialOverviewByPeriodo[periodo];
  }

  const response = await fetch(`/api/empreiteiro/dashboard/financial?periodo=${periodo}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar dados financeiros');
  }
  return response.json();
}
