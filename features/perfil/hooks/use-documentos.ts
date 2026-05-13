'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface EmpreiteiroDocumentoItem {
  id: string;
  fileId: string;
  tipo: string;
  status: string;
  observacao: string | null;
  createdAt: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
  signedUrl: string;
}

export const TIPOS_DOCUMENTO_OBRIGATORIOS = [
  { value: 'cnpj', label: 'Comprovante CNPJ' },
  { value: 'alvara', label: 'Alvará de Funcionamento' },
  { value: 'certidao-negativa', label: 'Certidão Negativa' },
  { value: 'outro', label: 'Outros' },
] as const;

const KEY = ['perfil', 'empreiteiro', 'documentos'] as const;

export function useEmpreiteiroDocumentos() {
  return useQuery<{ items: EmpreiteiroDocumentoItem[] }>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch('/api/perfil/empreiteiro/documentos', { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    // signed URLs expiram em 15 min — refetch ao focar/montar
    staleTime: 60 * 1000,
  });
}

export function useDeleteDocumento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fileId: string) => {
      const res = await fetch(`/api/uploads/${fileId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
