'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@shared/lib/queryClient';

/** XG10 — aditivos de contrato da obra. */

export interface ObraAditivoApi {
  id: string;
  obraId: string;
  descricao: string;
  /** `numeric` do Postgres chega como string pelo driver. */
  valor: string;
  data: string;
  criadoPor: string | null;
  createdAt: string | null;
}

export interface NovoAditivoInput {
  descricao: string;
  valor: number;
  data: string;
}

/**
 * Aditivo muda `valorTotal`, e com ele o saldo a receber e o percentual
 * recebido — todos derivados no detalhe da obra.
 */
function useInvalidarAditivos(obraId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['obras', obraId, 'aditivos'] });
    qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] });
    qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
    qc.invalidateQueries({ queryKey: ['admin', 'obras', obraId] });
  };
}

export function useObraAditivos(obraId: string, enabled = true) {
  return useQuery({
    queryKey: ['obras', obraId, 'aditivos'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/obras/${obraId}/aditivos`);
      const data = (await res.json()) as { rows: ObraAditivoApi[] };
      return data.rows;
    },
    enabled: enabled && Boolean(obraId),
    staleTime: 30_000,
  });
}

export function useCriarAditivo(obraId: string) {
  const invalidar = useInvalidarAditivos(obraId);
  return useMutation({
    mutationFn: async (body: NovoAditivoInput) => {
      const res = await apiRequest('POST', `/api/obras/${obraId}/aditivos`, body);
      return (await res.json()) as ObraAditivoApi;
    },
    onSuccess: invalidar,
  });
}

export function useExcluirAditivo(obraId: string) {
  const invalidar = useInvalidarAditivos(obraId);
  return useMutation({
    mutationFn: async (aditivoId: string) => {
      const res = await apiRequest('DELETE', `/api/obras/${obraId}/aditivos/${aditivoId}`);
      return (await res.json()) as { ok: true };
    },
    onSuccess: invalidar,
  });
}
