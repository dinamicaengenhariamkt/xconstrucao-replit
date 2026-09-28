'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SecoesPublicas } from '../secoes';

/**
 * Estado dos links públicos de uma obra, compartilhado entre o modal de
 * compartilhamento e o bloco de detalhes da obra.
 *
 * Antes o estado vivia num `useState` dentro do CompartilharModal e morria ao
 * fechar o modal. Centralizar numa query do TanStack faz as telas lerem a
 * mesma fonte e reagirem a criar/revogar sem precisar de callback entre elas.
 *
 * XG30 — a obra tem uma **lista** de links, um por público ("Cliente",
 * "Arquiteto"…), cada um com as próprias seções.
 */
export type ObraShare = {
  id: string;
  nome: string;
  path: string;
  expiraEm: string | null;
  criadoEm: string;
  visualizacoes: number;
  ultimoAcessoEm: string | null;
  secoes: SecoesPublicas;
};

export type ObraSharesState = { shares: ObraShare[]; limite: number };

export function obraShareQueryKey(obraId: string) {
  return ['xgestao', 'obra-share', obraId] as const;
}

const baseUrl = (obraId: string) => `/api/xgestao/obras/${obraId}/share`;

async function fetchObraShares(obraId: string): Promise<ObraSharesState> {
  const response = await fetch(baseUrl(obraId), { credentials: 'include', cache: 'no-store' });
  if (!response.ok) {
    const error = new Error('Não foi possível consultar os links.') as Error & { status: number };
    error.status = response.status;
    throw error;
  }
  return (await response.json()) as ObraSharesState;
}

/**
 * `enabled` permite que o bloco de detalhes carregue os links junto com a
 * obra, enquanto o modal só consulta quando é aberto.
 */
export function useObraShares(obraId: string, enabled = true) {
  return useQuery({
    queryKey: obraShareQueryKey(obraId),
    queryFn: () => fetchObraShares(obraId),
    enabled: Boolean(obraId) && enabled,
  });
}

/** URL absoluta a partir do path relativo devolvido pela API. */
export function toAbsoluteShareUrl(share: Pick<ObraShare, 'path'> | null | undefined): string {
  if (!share || typeof window === 'undefined') return '';
  return new URL(share.path, window.location.origin).toString();
}

/** Aplica `fn` à lista em cache, se ela já existir. */
function atualizarCache(
  queryClient: ReturnType<typeof useQueryClient>,
  obraId: string,
  fn: (shares: ObraShare[]) => ObraShare[],
) {
  queryClient.setQueryData<ObraSharesState>(obraShareQueryKey(obraId), (atual) =>
    atual ? { ...atual, shares: fn(atual.shares) } : atual,
  );
}

async function erroDaResposta(response: Response, padrao: string): Promise<Error> {
  const body = (await response.json().catch(() => null)) as { message?: string } | null;
  return new Error(body?.message ?? padrao);
}

export function useCriarObraShare(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ nome, expiraEm }: { nome: string; expiraEm: string | null }) => {
      const response = await fetch(baseUrl(obraId), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, expiraEm }),
      });
      if (!response.ok) throw await erroDaResposta(response, 'Não foi possível criar o link agora.');
      const body = (await response.json()) as { share: ObraShare };
      return body.share;
    },
    onSuccess: (share) => {
      // Escreve direto no cache: o POST já devolve o link novo, então refetchar
      // seria uma ida ao servidor para reler o que acabou de chegar.
      atualizarCache(queryClient, obraId, (shares) => [...shares, share]);
    },
  });
}

/**
 * Altera as seções de um link sem trocar o token. Atualiza o cache antes da
 * resposta para o switch não voltar sozinho enquanto a requisição está em voo,
 * e desfaz a mudança caso o servidor recuse.
 */
export function useAtualizarSecoes(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ linkId, secoes }: { linkId: string; secoes: SecoesPublicas }) => {
      const response = await fetch(`${baseUrl(obraId)}/${linkId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secoes }),
      });
      if (!response.ok) throw new Error('Não foi possível atualizar o que o link mostra.');
      const body = (await response.json()) as { share: ObraShare };
      return body.share;
    },
    onMutate: async ({ linkId, secoes }) => {
      const key = obraShareQueryKey(obraId);
      await queryClient.cancelQueries({ queryKey: key });
      const anterior = queryClient.getQueryData<ObraSharesState>(key);
      atualizarCache(queryClient, obraId, (shares) =>
        shares.map((share) => (share.id === linkId ? { ...share, secoes } : share)),
      );
      return { anterior };
    },
    onError: (_error, _vars, context) => {
      if (context?.anterior !== undefined) {
        queryClient.setQueryData(obraShareQueryKey(obraId), context.anterior);
      }
    },
    onSuccess: (share) => {
      atualizarCache(queryClient, obraId, (shares) => shares.map((s) => (s.id === share.id ? share : s)));
    },
  });
}

export function useRevogarObraShare(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (linkId: string) => {
      const response = await fetch(`${baseUrl(obraId)}/${linkId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Não foi possível revogar o link agora.');
      return linkId;
    },
    onSuccess: (linkId) => {
      atualizarCache(queryClient, obraId, (shares) => shares.filter((share) => share.id !== linkId));
    },
  });
}
