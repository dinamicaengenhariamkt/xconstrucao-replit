/**
 * Hooks React Query para a tela de "Meus Recebimentos" do empreiteiro.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  getMedicoesEmpreiteiro,
  getPagamentosKPI,
} from '../api/pagamentos-service';
import { QUERY_CONFIG } from '../constants';
import type {
  MedicaoEmpreiteiro,
  PagamentosEmpreiteiroKPI,
} from '../types';

export function usePagamentosEmpreiteiro(): UseQueryResult<MedicaoEmpreiteiro[], Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'pagamentos', 'medicoes'],
    queryFn: getMedicoesEmpreiteiro,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function usePagamentosEmpreiteiroKPI(): UseQueryResult<PagamentosEmpreiteiroKPI, Error> {
  return useQuery({
    queryKey: ['empreiteiro', 'pagamentos', 'kpi'],
    queryFn: getPagamentosKPI,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
