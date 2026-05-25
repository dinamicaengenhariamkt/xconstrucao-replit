import {
  useInfiniteQuery,
  useQuery,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getNovasObras,
  getPerfilStatus,
  getObraDetalhe,
  type GetNovasObrasParams,
  type PaginatedResponse,
} from '../api/novas-obras-service';
import { QUERY_CONFIG } from '../constants';
import type { NovaObra, PerfilStatus, ObraDetalhe } from '../types';

export function useNovasObras(
  params: GetNovasObrasParams = {},
): UseQueryResult<PaginatedResponse<NovaObra>, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'novas-obras', params],
    queryFn: () => getNovasObras(params),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function useNovasObrasInfinite(
  params: Omit<GetNovasObrasParams, 'page'> = {},
): UseInfiniteQueryResult<
  { pages: PaginatedResponse<NovaObra>[]; pageParams: number[] },
  Error
> {
  return useInfiniteQuery({
    queryKey: ['empreiteiro', 'novas-obras', 'infinite', params],
    queryFn: ({ pageParam }) => getNovasObras({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
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
