'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@shared/lib/queryClient';

/** XG10 — consumo de armazenamento da obra (barra da aba Documentos). */

export interface ObraStorageUso {
  usadoBytes: number;
  limiteBytes: number;
  arquivos: number;
  percentual: number;
  disponivelBytes: number;
}

export function useObraStorage(obraId: string, enabled = true) {
  return useQuery({
    queryKey: ['obras', obraId, 'storage'],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/obras/${obraId}/storage`);
      return (await res.json()) as ObraStorageUso;
    },
    enabled: enabled && Boolean(obraId),
    staleTime: 30_000,
  });
}

/** Formata bytes como MB inteiros — a unidade em que os limites foram pensados. */
export function formatarMB(bytes: number): string {
  const mb = bytes / 1_000_000;
  if (mb < 1 && bytes > 0) return '<1 MB';
  return `${Math.round(mb)} MB`;
}
