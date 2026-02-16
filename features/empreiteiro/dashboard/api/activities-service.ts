/**
 * Service para buscar atividades recentes
 */

import { ENABLE_MOCK } from '../constants';
import { mockActivities } from '../mocks/activities.mock';
import type { Activity } from '../types';

export async function getRecentActivities(): Promise<Activity[]> {
  if (ENABLE_MOCK) {
    // Simula delay de rede
    await new Promise((resolve) => setTimeout(resolve, 350));
    return mockActivities;
  }

  // Implementação real com API
  const response = await fetch('/api/empreiteiro/dashboard/activities');
  if (!response.ok) {
    throw new Error('Erro ao buscar atividades recentes');
  }
  return response.json();
}
