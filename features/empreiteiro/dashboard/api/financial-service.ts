/**
 * Service para buscar dados financeiros
 */

import type { DashboardPeriodo, FinancialOverview } from '../types';

export async function getFinancialData(
  periodo: DashboardPeriodo = '12meses',
): Promise<FinancialOverview> {
  const response = await fetch(`/api/empreiteiro/dashboard/financial?periodo=${periodo}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar dados financeiros');
  }
  return response.json();
}
