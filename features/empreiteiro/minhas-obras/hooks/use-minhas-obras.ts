import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getMinhasObras } from '../api/minhas-obras-service';
import { QUERY_CONFIG } from '../constants';
import type { MinhaObra } from '../types';

export function useMinhasObras(): UseQueryResult<MinhaObra[], Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'minhas-obras'],
    queryFn: getMinhasObras,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
