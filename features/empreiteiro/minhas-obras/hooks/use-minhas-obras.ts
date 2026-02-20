import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getMinhasObras, getMinhaObraDetalhe } from '../api/minhas-obras-service';
import { QUERY_CONFIG } from '../constants';
import type { MinhaObra, MinhaObraDetalhe } from '../types';

export function useMinhasObras(): UseQueryResult<MinhaObra[], Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'minhas-obras'],
    queryFn: getMinhasObras,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function useMinhaObraDetalhe(id: string): UseQueryResult<MinhaObraDetalhe, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'minhas-obras', id],
    queryFn: () => getMinhaObraDetalhe(id),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
    enabled: !!id,
  });
}
