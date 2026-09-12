'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SecoesPublicas } from '../secoes';

/**
 * Estado do link público de uma obra, compartilhado entre o modal de
 * compartilhamento e a tela de edição.
 *
 * Antes o estado vivia num `useState` dentro do CompartilharModal e morria ao
 * fechar o modal — por isso o checklist da edição não tinha como saber se o
 * link existia. Centralizar numa query do TanStack faz as duas telas lerem a
 * mesma fonte e reagirem a gerar/revogar sem precisar de callback entre elas.
 */
export type ObraShare = {
  path: string;
  expiraEm: string | null;
  criadoEm: string;
  visualizacoes: number;
  ultimoAcessoEm: string | null;
  secoes: SecoesPublicas;
};

export function obraShareQueryKey(obraId: string) {
  return ['xgestao', 'obra-share', obraId] as const;
}

async function fetchObraShare(obraId: string): Promise<ObraShare | null> {
  const response = await fetch(`/api/xgestao/obras/${obraId}/share`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Não foi possível consultar o link.');
  const body = (await response.json()) as { share: ObraShare | null };
  return body.share;
}

/**
 * `enabled` permite que a tela de edição carregue o estado do link junto com a
 * obra, enquanto o modal só consulta quando é aberto.
 */
export function useObraShare(obraId: string, enabled = true) {
  return useQuery({
    queryKey: obraShareQueryKey(obraId),
    queryFn: () => fetchObraShare(obraId),
    enabled: Boolean(obraId) && enabled,
  });
}

/** URL absoluta a partir do path relativo devolvido pela API. */
export function toAbsoluteShareUrl(share: ObraShare | null | undefined): string {
  if (!share || typeof window === 'undefined') return '';
  return new URL(share.path, window.location.origin).toString();
}

export function useGerarObraShare(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (expiraEm: string | null) => {
      const response = await fetch(`/api/xgestao/obras/${obraId}/share`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiraEm }),
      });
      if (!response.ok) throw new Error('Não foi possível criar o link agora.');
      const body = (await response.json()) as { share: ObraShare };
      return body.share;
    },
    onSuccess: (share) => {
      // Escreve direto no cache: o POST já devolve a capability nova, então
      // refetchar seria uma ida ao servidor para reler o que acabou de chegar.
      queryClient.setQueryData(obraShareQueryKey(obraId), share);
    },
  });
}

/**
 * Altera as seções sem trocar o token. Atualiza o cache antes da resposta para
 * o switch não voltar sozinho enquanto a requisição está em voo, e desfaz a
 * mudança caso o servidor recuse.
 */
export function useAtualizarSecoes(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (secoes: SecoesPublicas) => {
      const response = await fetch(`/api/xgestao/obras/${obraId}/share`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secoes }),
      });
      if (!response.ok) throw new Error('Não foi possível atualizar o que o link mostra.');
      const body = (await response.json()) as { share: ObraShare };
      return body.share;
    },
    onMutate: async (secoes) => {
      const key = obraShareQueryKey(obraId);
      await queryClient.cancelQueries({ queryKey: key });
      const anterior = queryClient.getQueryData<ObraShare | null>(key);
      if (anterior) queryClient.setQueryData<ObraShare>(key, { ...anterior, secoes });
      return { anterior };
    },
    onError: (_error, _secoes, context) => {
      if (context?.anterior !== undefined) {
        queryClient.setQueryData(obraShareQueryKey(obraId), context.anterior);
      }
    },
    onSuccess: (share) => {
      queryClient.setQueryData(obraShareQueryKey(obraId), share);
    },
  });
}

export function useRevogarObraShare(obraId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/xgestao/obras/${obraId}/share`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Não foi possível revogar o link agora.');
      return (await response.json()) as { revoked: boolean };
    },
    onSuccess: () => {
      queryClient.setQueryData(obraShareQueryKey(obraId), null);
    },
  });
}
