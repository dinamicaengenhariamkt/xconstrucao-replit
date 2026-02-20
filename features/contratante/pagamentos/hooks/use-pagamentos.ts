import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getPagamentos, getPagamentosKPI } from '../api/pagamentos-service';
import { QUERY_CONFIG } from '../constants';
import type { PagamentoContratante, PagamentosKPI } from '../types';

export function usePagamentos(): UseQueryResult<PagamentoContratante[], Error> {
  return useQuery({
    queryKey: ['contratante', 'pagamentos'],
    queryFn: getPagamentos,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function usePagamentosKPI(): UseQueryResult<PagamentosKPI, Error> {
  return useQuery({
    queryKey: ['contratante', 'pagamentos', 'kpi'],
    queryFn: getPagamentosKPI,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
