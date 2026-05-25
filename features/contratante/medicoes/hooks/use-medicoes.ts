/**
 * Hooks React Query para a tela "Medições" do contratante (Task #47).
 */

import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import {
  aprovarMedicao,
  contestarMedicao,
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

export function useAprovarMedicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aprovarMedicao(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratante', 'medicoes'] });
    },
  });
}

export function useContestarMedicao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => contestarMedicao(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratante', 'medicoes'] });
    },
  });
}
