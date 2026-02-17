/**
 * Hook React Query para atividades recentes
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getRecentActivities } from '../api/activities-service';
import { QUERY_CONFIG } from '../constants';
import type { Activity } from '../types';

export function useRecentActivities(): UseQueryResult<Activity[], Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'activities'],
    queryFn: getRecentActivities,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
