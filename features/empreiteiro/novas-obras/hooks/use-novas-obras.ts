import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getNovasObras, getPerfilStatus, getObraDetalhe } from '../api/novas-obras-service';
import { QUERY_CONFIG } from '../constants';
import type { NovaObra, PerfilStatus, ObraDetalhe } from '../types';

export function useNovasObras(): UseQueryResult<NovaObra[], Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'novas-obras'],
    queryFn: getNovasObras,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function usePerfilStatus(): UseQueryResult<PerfilStatus, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'perfil-status'],
    queryFn: getPerfilStatus,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function useObraDetalhe(id: string): UseQueryResult<ObraDetalhe, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'novas-obras', id],
    queryFn: () => getObraDetalhe(id),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
    enabled: !!id,
  });
}
