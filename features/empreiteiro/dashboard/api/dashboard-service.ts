/**
 * Service para buscar estatísticas do dashboard
 */

import type { DashboardPeriodo, DashboardStats } from '../types';

export async function getDashboardStats(
  periodo: DashboardPeriodo = '12meses',
): Promise<DashboardStats> {
  const response = await fetch(`/api/empreiteiro/dashboard/stats?periodo=${periodo}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar estatísticas do dashboard');
  }
  return response.json();
}
