/**
 * Hook React Query para dados financeiros
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getFinancialData } from '../api/financial-service';
import { QUERY_CONFIG } from '../constants';
import type { DashboardPeriodo, FinancialOverview } from '../types';

export function useFinancialData(
  periodo: DashboardPeriodo = '12meses',
): UseQueryResult<FinancialOverview, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'financial', periodo],
    queryFn: () => getFinancialData(periodo),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
