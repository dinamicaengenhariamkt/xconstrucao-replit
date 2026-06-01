/**
 * Service para a feature "Disputas" (admin). Consome a API real (J10).
 */

import type { Disputa, DisputasKPI } from '../types';

export async function getDisputas(): Promise<Disputa[]> {
  const response = await fetch('/api/admin/disputas');
  if (!response.ok) throw new Error('Erro ao buscar disputas');
  return response.json();
}

export async function getDisputasKPI(): Promise<DisputasKPI> {
  const response = await fetch('/api/admin/disputas/kpi');
  if (!response.ok) throw new Error('Erro ao buscar KPI de disputas');
  return response.json();
}
