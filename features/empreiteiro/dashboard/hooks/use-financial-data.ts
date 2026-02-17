/**
 * Hook React Query para dados financeiros
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getFinancialData } from '../api/financial-service';
import { QUERY_CONFIG } from '../constants';
import type { FinancialOverview } from '../types';

export function useFinancialData(): UseQueryResult<FinancialOverview, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'financial'],
    queryFn: getFinancialData,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
