/**
 * Service para buscar atividades recentes
 */

import { ENABLE_MOCK } from '../constants';
import { mockActivities } from '../mocks/activities.mock';
import type { Activity, DashboardPeriodo } from '../types';

const PERIODO_TO_DAYS: Record<DashboardPeriodo, number> = {
  '7dias': 7,
  '30dias': 30,
  '3meses': 90,
  '12meses': 365,
};

function filterByPeriodo(activities: Activity[], periodo: DashboardPeriodo): Activity[] {
  const days = PERIODO_TO_DAYS[periodo];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return activities.filter((a) => a.timestamp.getTime() >= cutoff);
}

export async function getRecentActivities(
  periodo: DashboardPeriodo = '12meses',
): Promise<Activity[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return filterByPeriodo(mockActivities, periodo);
  }

  const response = await fetch(`/api/empreiteiro/dashboard/activities?periodo=${periodo}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar atividades recentes');
  }
  return response.json();
}
