'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@shared/lib/queryClient';
import type { LancamentoCategoria, LancamentoTipo } from '@features/financeiro/lancamentos';

/**
 * XG10 — lançamentos financeiros da obra (entrada e saída).
 *
 * Usa `apiRequest` em vez de `fetch` cru: ele renova a sessão e repete uma vez
 * no 401 (shared/lib/queryClient.ts), então um token expirado não faz o usuário
 * perder o lançamento que acabou de digitar.
 */

export interface ObraLancamentoApi {
  id: string;
  obraId: string | null;
  tipo: LancamentoTipo;
  categoria: LancamentoCategoria | null;
  descricao: string;
  /** `numeric` do Postgres chega como string pelo driver. */
  valor: string;
  data: string;
  status: string;
  comprovanteFileId: string | null;
  medicaoId: string | null;
  origemId: string | null;
  createdAt: string | null;
}

export interface NovoLancamentoInput {
  tipo: LancamentoTipo;
  categoria?: LancamentoCategoria | null;
  descricao: string;
  valor: number;
  data: string;
  comprovanteFileId?: string | null;
}

export type EditarLancamentoInput = Partial<Omit<NovoLancamentoInput, 'tipo'>> & {
  lancamentoId: string;
};

/**
 * Um lançamento muda receita, custo, margem e o fator financeiro da saúde —
 * todos derivados no detalhe da obra. Invalidar só a lista deixaria os cards
 * com número velho.
 */
function useInvalidarFinanceiro(obraId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['obras', obraId, 'lancamentos'] });
    qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] });
    qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
    qc.invalidateQueries({ queryKey: ['admin', 'obras', obraId] });
    qc.invalidateQueries({ queryKey: ['obras', obraId, 'health'] });
  };
}

export function useObraLancamentos(obraId: string, enabled = true) {
  return useQuery({
    queryKey: ['obras', obraId, 'lancamentos'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/obras/${obraId}/financeiro`);
      const data = (await res.json()) as { rows: ObraLancamentoApi[] };
      return data.rows;
    },
    enabled: enabled && Boolean(obraId),
    staleTime: 30_000,
  });
}

export function useCriarLancamento(obraId: string) {
  const invalidar = useInvalidarFinanceiro(obraId);
  return useMutation({
    mutationFn: async (body: NovoLancamentoInput) => {
      const res = await apiRequest('POST', `/api/obras/${obraId}/financeiro`, body);
      return (await res.json()) as ObraLancamentoApi;
    },
    onSuccess: invalidar,
  });
}

export function useEditarLancamento(obraId: string) {
  const invalidar = useInvalidarFinanceiro(obraId);
  return useMutation({
    mutationFn: async ({ lancamentoId, ...body }: EditarLancamentoInput) => {
      const res = await apiRequest(
        'PATCH',
        `/api/obras/${obraId}/financeiro/${lancamentoId}`,
        body,
      );
      return (await res.json()) as ObraLancamentoApi;
    },
    onSuccess: invalidar,
  });
}

export function useExcluirLancamento(obraId: string) {
  const invalidar = useInvalidarFinanceiro(obraId);
  return useMutation({
    mutationFn: async (lancamentoId: string) => {
      const res = await apiRequest(
        'DELETE',
        `/api/obras/${obraId}/financeiro/${lancamentoId}`,
      );
      return (await res.json()) as { ok: true };
    },
    onSuccess: invalidar,
  });
}
