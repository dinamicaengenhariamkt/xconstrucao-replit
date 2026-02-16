/**
 * Hook React Query para estatísticas do dashboard
 */

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../api/dashboard-service';
import { QUERY_CONFIG } from '../constants';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'stats'],
    queryFn: getDashboardStats,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
