/**
 * Hook React Query para atividades recentes
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getRecentActivities } from '../api/activities-service';
import { QUERY_CONFIG } from '../constants';
import type { Activity, DashboardPeriodo } from '../types';

export function useRecentActivities(
  periodo: DashboardPeriodo = '12meses',
): UseQueryResult<Activity[], Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'activities', periodo],
    queryFn: () => getRecentActivities(periodo),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
