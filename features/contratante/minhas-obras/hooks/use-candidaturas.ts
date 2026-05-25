'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  aceitarCandidatura,
  fetchCandidaturasObra,
  rejeitarCandidatura,
  type CandidaturaApiRow,
} from '../api/candidaturas-service';

export function useCandidaturasObra(obraId: string | null | undefined) {
  return useQuery<CandidaturaApiRow[]>({
    queryKey: ['contratante', 'candidaturas', obraId],
    queryFn: () => fetchCandidaturasObra(obraId as string),
    enabled: !!obraId,
    staleTime: 30_000,
  });
}

export function useAceitarCandidatura(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, mensagem }: { id: string; mensagem?: string }) =>
      aceitarCandidatura(id, mensagem),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratante', 'candidaturas', obraId] });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras'] });
    },
  });
}

export function useRejeitarCandidatura(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      rejeitarCandidatura(id, motivo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contratante', 'candidaturas', obraId] });
    },
  });
}
