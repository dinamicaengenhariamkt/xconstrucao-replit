'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelarCandidatura,
  fetchMinhasCandidaturas,
  type MinhaCandidaturaRow,
} from '../api/service';

export function useMinhasCandidaturas() {
  return useQuery<MinhaCandidaturaRow[]>({
    queryKey: ['empreiteiro', 'minhas-candidaturas'],
    queryFn: fetchMinhasCandidaturas,
    staleTime: 30_000,
  });
}

export function useCancelarCandidatura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelarCandidatura(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-candidaturas'] });
    },
  });
}
