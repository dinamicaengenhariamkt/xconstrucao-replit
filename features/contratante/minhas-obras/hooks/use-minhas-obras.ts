import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getObrasContratante, getObraContratanteDetalhe } from '../api/minhas-obras-service';
import { QUERY_CONFIG } from '../constants';
import type { ObraContratante, ObraContratanteDetalhe } from '../types';

export function useObrasContratante(): UseQueryResult<ObraContratante[], Error> {
  return useQuery({
    queryKey: ['contratante', 'minhas-obras'],
    queryFn: getObrasContratante,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function useObraContratanteDetalhe(id: string): UseQueryResult<ObraContratanteDetalhe, Error> {
  return useQuery({
    queryKey: ['contratante', 'minhas-obras', id],
    queryFn: () => getObraContratanteDetalhe(id),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
    enabled: !!id,
  });
}
