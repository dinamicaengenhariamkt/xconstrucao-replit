'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@shared/lib/queryClient';

/**
 * XG10 — anexos da obra (documentos e links).
 *
 * A aba Documentos usava `useState` sobre os dados iniciais: enviar, editar e
 * excluir mexiam só no estado do React e sumiam no refresh. Estas mutações
 * falam com `/api/obras/[id]/anexos`, que sempre existiu.
 */

export type ObraAnexoTipo =
  | 'projeto_arquitetonico'
  | 'projeto_estrutural'
  | 'art_rrt'
  | 'alvara'
  | 'foto_local'
  | 'contrato'
  | 'outros';

export interface ObraAnexoApi {
  id: string;
  tipo: ObraAnexoTipo;
  observacao: string | null;
  createdAt: string | null;
  fileId: string | null;
  linkUrl: string | null;
  originalName: string | null;
  mime: string | null;
  sizeBytes: number | null;
  /** URL assinada (arquivo) ou o próprio link externo. */
  url: string | null;
}

export interface NovoAnexoArquivo {
  fileId: string;
  tipo: ObraAnexoTipo;
  observacao?: string | null;
}

export interface NovoAnexoLink {
  linkUrl: string;
  titulo: string;
  tipo: ObraAnexoTipo;
  observacao?: string | null;
}

function useInvalidarAnexos(obraId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['obras', obraId, 'anexos'] });
    // O detalhe carrega `documentos` junto; sem isto a lista da aba volta
    // ao estado antigo na próxima renderização.
    qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] });
    qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
    qc.invalidateQueries({ queryKey: ['obras', obraId, 'storage'] });
  };
}

export function useObraAnexos(obraId: string, enabled = true) {
  return useQuery({
    queryKey: ['obras', obraId, 'anexos'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/obras/${obraId}/anexos`);
      return (await res.json()) as ObraAnexoApi[];
    },
    enabled: enabled && Boolean(obraId),
    staleTime: 30_000,
  });
}

export function useCriarAnexo(obraId: string) {
  const invalidar = useInvalidarAnexos(obraId);
  return useMutation({
    mutationFn: async (body: NovoAnexoArquivo | NovoAnexoLink) => {
      const res = await apiRequest('POST', `/api/obras/${obraId}/anexos`, body);
      return (await res.json()) as ObraAnexoApi;
    },
    onSuccess: invalidar,
  });
}

export function useExcluirAnexo(obraId: string) {
  const invalidar = useInvalidarAnexos(obraId);
  return useMutation({
    mutationFn: async (anexoId: string) => {
      const res = await apiRequest('DELETE', `/api/obras/${obraId}/anexos/${anexoId}`);
      return (await res.json()) as { ok: true };
    },
    onSuccess: invalidar,
  });
}
