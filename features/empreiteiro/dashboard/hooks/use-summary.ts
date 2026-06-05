import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_CONFIG } from '../constants';
import { getEmpreiteiroSummary, type EmpreiteiroSummary } from '../api/summary-service';

/**
 * Resumo real de saúde + lucro das obras do empreiteiro (J17). Substitui os
 * `getMockHealthSummary`/`getMockProfitSummary` chamados na página.
 */
export function useEmpreiteiroSummary(): UseQueryResult<EmpreiteiroSummary, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'dashboard', 'summary'],
    queryFn: getEmpreiteiroSummary,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
