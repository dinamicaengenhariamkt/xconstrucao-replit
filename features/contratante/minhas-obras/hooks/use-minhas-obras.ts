import {
  useInfiniteQuery,
  useQuery,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  getObrasContratante,
  getObraContratanteDetalhe,
  type GetObrasContratanteParams,
  type PaginatedResponse,
  type ObraContratanteRow,
} from '../api/minhas-obras-service';
import { QUERY_CONFIG } from '../constants';
import type { ObraContratanteDetalhe } from '../types';

export function useObrasContratante(
  params: GetObrasContratanteParams = {},
): UseQueryResult<PaginatedResponse<ObraContratanteRow>, Error> {
  return useQuery({
    queryKey: ['contratante', 'minhas-obras', params],
    queryFn: () => getObrasContratante(params),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function useObrasContratanteInfinite(
  params: Omit<GetObrasContratanteParams, 'page'> = {},
): UseInfiniteQueryResult<
  { pages: PaginatedResponse<ObraContratanteRow>[]; pageParams: number[] },
  Error
> {
  return useInfiniteQuery({
    queryKey: ['contratante', 'minhas-obras', 'infinite', params],
    queryFn: ({ pageParam }) =>
      getObrasContratante({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
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
