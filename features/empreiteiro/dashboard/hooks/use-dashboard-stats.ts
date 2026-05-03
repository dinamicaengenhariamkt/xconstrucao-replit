/**
 * Hook React Query para estatísticas do dashboard
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboard-service';
import { QUERY_CONFIG } from '../constants';
import type { DashboardPeriodo, DashboardStats } from '../types';

export function useDashboardStats(
  periodo: DashboardPeriodo = '12meses',
): UseQueryResult<DashboardStats, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'stats', periodo],
    queryFn: () => getDashboardStats(periodo),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
