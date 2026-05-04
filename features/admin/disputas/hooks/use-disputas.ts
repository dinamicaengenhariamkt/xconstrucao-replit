import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getDisputas, getDisputasKPI } from '../api/disputas-service';
import { QUERY_CONFIG } from '../constants';
import type { Disputa, DisputasKPI } from '../types';

export function useDisputas(): UseQueryResult<Disputa[], Error> {
  return useQuery({
    queryKey: ['admin', 'disputas'],
    queryFn: getDisputas,
    ...QUERY_CONFIG,
  });
}

export function useDisputasKPI(): UseQueryResult<DisputasKPI, Error> {
  return useQuery({
    queryKey: ['admin', 'disputas', 'kpi'],
    queryFn: getDisputasKPI,
    ...QUERY_CONFIG,
  });
}
