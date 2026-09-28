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
  /** XG20 — membro da equipe que recebeu a saída, quando veio da lista. */
  fornecedorId: string | null;
  /** Nome de quem recebeu: do membro, ou digitado à mão. Sobrevive à saída dele da equipe. */
  fornecedorNome: string | null;
  createdAt: string | null;
  /** Ator da atividade associada, quando o servidor consegue identificá-lo. */
  actorName?: string | null;
}

export interface NovoLancamentoInput {
  tipo: LancamentoTipo;
  categoria?: LancamentoCategoria | null;
  descricao: string;
  valor: number;
  data: string;
  comprovanteFileId?: string | null;
  fornecedorId?: string | null;
  fornecedorNome?: string | null;
}

export type EditarLancamentoInput = Partial<Omit<NovoLancamentoInput, 'tipo'>> & {
  lancamentoId: string;
};

/**
 * Um lançamento muda receita, custo, margem e o fator financeiro da saúde —
 * todos derivados no detalhe da obra. Invalidar só a lista deixaria os cards
 * com número velho.
 *
 * Aqui a invalidação do detalhe é mesmo necessária, diferente do toggle de
 * checklist: receita e custo saem de `recebedorUserId`/`pagadorUserId` e do
 * `status: 'pago'`, e o saldo a receber é `contratado + aditivos − receita`.
 * Recalcular isso no cliente recriaria a segunda fonte de verdade que a XG22
 * acabou de eliminar. O que dá para adiantar é a **lista** (tabela crua), e é
 * o que `aplicarNaLista` faz — a linha aparece na hora e os KPIs chegam logo
 * atrás, sinalizados por `isFetching`.
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

/**
 * Escreve o resultado da mutation na lista em cache, sem esperar o refetch.
 *
 * A lista é a tabela crua — não há regra de negócio a replicar, só a linha
 * entrando, mudando ou saindo. Mantém a ordenação do servidor (`data` desc,
 * depois `createdAt` desc) para a linha nova não aparecer no lugar errado e
 * pular quando o refetch pousar.
 */
function useAplicarNaLista(obraId: string) {
  const qc = useQueryClient();
  return (fn: (rows: ObraLancamentoApi[]) => ObraLancamentoApi[]) => {
    qc.setQueryData<ObraLancamentoApi[]>(['obras', obraId, 'lancamentos'], (prev) =>
      prev ? ordenarLancamentos(fn(prev)) : prev,
    );
  };
}

/** Mesma ordenação do GET: mais recentes primeiro. */
function ordenarLancamentos(rows: ObraLancamentoApi[]): ObraLancamentoApi[] {
  return [...rows].sort((a, b) => {
    const porData = b.data.localeCompare(a.data);
    if (porData !== 0) return porData;
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
  });
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
  const aplicarNaLista = useAplicarNaLista(obraId);
  return useMutation({
    mutationFn: async (body: NovoLancamentoInput) => {
      const res = await apiRequest('POST', `/api/obras/${obraId}/financeiro`, body);
      return (await res.json()) as ObraLancamentoApi;
    },
    onSuccess: (criado) => {
      // A linha entra com o registro que o servidor devolveu (id e status reais),
      // então nada pisca quando o refetch dos KPIs pousar.
      aplicarNaLista((rows) => [criado, ...rows.filter((l) => l.id !== criado.id)]);
      invalidar();
    },
  });
}

export function useEditarLancamento(obraId: string) {
  const invalidar = useInvalidarFinanceiro(obraId);
  const aplicarNaLista = useAplicarNaLista(obraId);
  return useMutation({
    mutationFn: async ({ lancamentoId, ...body }: EditarLancamentoInput) => {
      const res = await apiRequest(
        'PATCH',
        `/api/obras/${obraId}/financeiro/${lancamentoId}`,
        body,
      );
      return (await res.json()) as ObraLancamentoApi;
    },
    onSuccess: (atualizado) => {
      aplicarNaLista((rows) =>
        rows.map((l) =>
          l.id === atualizado.id
            ? { ...atualizado, actorName: atualizado.actorName ?? l.actorName }
            : l,
        ),
      );
      invalidar();
    },
  });
}

export function useExcluirLancamento(obraId: string) {
  const invalidar = useInvalidarFinanceiro(obraId);
  const aplicarNaLista = useAplicarNaLista(obraId);
  return useMutation({
    mutationFn: async (lancamentoId: string) => {
      const res = await apiRequest(
        'DELETE',
        `/api/obras/${obraId}/financeiro/${lancamentoId}`,
      );
      return (await res.json()) as { ok: true };
    },
    onSuccess: (_res, lancamentoId) => {
      aplicarNaLista((rows) => rows.filter((l) => l.id !== lancamentoId));
      invalidar();
    },
  });
}
