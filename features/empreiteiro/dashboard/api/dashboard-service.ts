/**
 * Service para buscar estatísticas do dashboard
 */

import { ENABLE_MOCK } from '../constants';
import { mockDashboardStats } from '../mocks/dashboard-stats.mock';
import type { DashboardStats } from '../types';

export async function getDashboardStats(): Promise<DashboardStats> {
  if (ENABLE_MOCK) {
    // Simula delay de rede
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockDashboardStats;
  }

  // Implementação real com API
  const response = await fetch('/api/empreiteiro/dashboard/stats');
  if (!response.ok) {
    throw new Error('Erro ao buscar estatísticas do dashboard');
  }
  return response.json();
}
