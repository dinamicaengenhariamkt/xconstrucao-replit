/**
 * Service para buscar dados financeiros
 */

import { ENABLE_MOCK } from '../constants';
import { mockFinancialData } from '../mocks/financial-data.mock';
import type { FinancialOverview } from '../types';

export async function getFinancialData(): Promise<FinancialOverview> {
  if (ENABLE_MOCK) {
    // Simula delay de rede
    await new Promise((resolve) => setTimeout(resolve, 400));
    return mockFinancialData;
  }

  // Implementação real com API
  const response = await fetch('/api/empreiteiro/dashboard/financial');
  if (!response.ok) {
    throw new Error('Erro ao buscar dados financeiros');
  }
  return response.json();
}
