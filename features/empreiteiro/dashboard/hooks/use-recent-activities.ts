/**
 * Hook React Query para atividades recentes
 */

import { useQuery } from '@tanstack/react-query';
import { getRecentActivities } from '../api/activities-service';
import { QUERY_CONFIG } from '../constants';

export function useRecentActivities() {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'activities'],
    queryFn: getRecentActivities,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
