/**
 * Hooks React Query para a tela "Medições" do contratante.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import {
  getMedicoesContratante,
  getMedicoesContratanteKPI,
} from '../api/medicoes-service';
import { QUERY_CONFIG } from '../constants';
import type { MedicaoContratante, MedicoesContratanteKPI } from '../types';

export function useMedicoesContratante(): UseQueryResult<MedicaoContratante[], Error> {
  return useQuery({
    queryKey: ['contratante', 'medicoes'],
    queryFn: getMedicoesContratante,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}

export function useMedicoesContratanteKPI(): UseQueryResult<MedicoesContratanteKPI, Error> {
  return useQuery({
    queryKey: ['contratante', 'medicoes', 'kpi'],
    queryFn: getMedicoesContratanteKPI,
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
