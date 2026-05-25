import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useToast } from '@shared/hooks/use-toast';
import {
  addObraSalva,
  getObrasSalvas,
  removeObraSalva,
  type ObrasSalvasResponse,
} from '../api/obras-salvas-service';

const QUERY_KEY = ['empreiteiro', 'obras-salvas'] as const;

export function useObrasSalvas() {
  return useQuery<ObrasSalvasResponse>({
    queryKey: QUERY_KEY,
    queryFn: getObrasSalvas,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Hook auxiliar: retorna Set<string> dos ids salvos para checagem O(1). */
export function useObrasSalvasIds(): Set<string> {
  const { data } = useObrasSalvas();
  return useMemo(() => new Set((data?.rows ?? []).map((o) => o.id)), [data?.rows]);
}

export function useToggleObraSalva() {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ obraId, isSaved }: { obraId: string; isSaved: boolean; obra?: import('@features/empreiteiro/novas-obras/types').NovaObra }) => {
      if (isSaved) await removeObraSalva(obraId);
      else await addObraSalva(obraId);
      return { obraId, wasSaved: isSaved };
    },
    onMutate: async ({ obraId, isSaved, obra }) => {
      await qc.cancelQueries({ queryKey: QUERY_KEY });
      const prev = qc.getQueryData<ObrasSalvasResponse>(QUERY_KEY);
      if (prev) {
        let next: ObrasSalvasResponse;
        if (isSaved) {
          next = { rows: prev.rows.filter((o) => o.id !== obraId), total: Math.max(0, prev.total - 1) };
        } else if (obra && !prev.rows.some((o) => o.id === obraId)) {
          next = { rows: [obra, ...prev.rows], total: prev.total + 1 };
        } else if (!prev.rows.some((o) => o.id === obraId)) {
          // Sem snapshot — refetch resolve, mas atualiza total p/ feedback imediato.
          next = { rows: prev.rows, total: prev.total + 1 };
        } else {
          next = prev;
        }
        qc.setQueryData(QUERY_KEY, next);
      }
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(QUERY_KEY, ctx.prev);
      toast({
        title: 'Falha ao atualizar favoritos',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
