/**
 * Hook React Query para dados financeiros
 */

import { useQuery } from '@tanstack/react-query';
import { getFinancialData } from '../api/financial-service';
import { QUERY_CONFIG } from '../constants';

export function useFinancialData() {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'financial'],
    queryFn: getFinancialData,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
