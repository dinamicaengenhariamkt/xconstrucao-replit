/**
 * Hook React Query para estatísticas do dashboard
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboard-service';
import { QUERY_CONFIG } from '../constants';
import type { DashboardStats } from '../types';

export function useDashboardStats(): UseQueryResult<DashboardStats, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
