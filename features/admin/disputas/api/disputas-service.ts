/**
 * Service para a feature "Disputas" (admin).
 */

import { ENABLE_MOCK } from '../constants';
import { mockDisputas, mockDisputasKPI } from '../mocks';
import type { Disputa, DisputasKPI } from '../types';

export async function getDisputas(): Promise<Disputa[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockDisputas;
  }
  const response = await fetch('/api/admin/disputas');
  if (!response.ok) throw new Error('Erro ao buscar disputas');
  return response.json();
}

export async function getDisputasKPI(): Promise<DisputasKPI> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockDisputasKPI;
  }
  const response = await fetch('/api/admin/disputas/kpi');
  if (!response.ok) throw new Error('Erro ao buscar KPI de disputas');
  return response.json();
}
