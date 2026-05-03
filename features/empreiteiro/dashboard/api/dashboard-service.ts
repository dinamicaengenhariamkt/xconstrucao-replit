/**
 * Service para buscar estatísticas do dashboard
 */

import { ENABLE_MOCK } from '../constants';
import { mockDashboardStatsByPeriodo } from '../mocks/dashboard-stats.mock';
import type { DashboardPeriodo, DashboardStats } from '../types';

export async function getDashboardStats(
  periodo: DashboardPeriodo = '12meses',
): Promise<DashboardStats> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockDashboardStatsByPeriodo[periodo];
  }

  const response = await fetch(`/api/empreiteiro/dashboard/stats?periodo=${periodo}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar estatísticas do dashboard');
  }
  return response.json();
}
