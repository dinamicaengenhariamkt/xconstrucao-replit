'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface PortfolioItem {
  id: string;
  fileId: string;
  titulo: string | null;
  ordem: number;
  createdAt: string;
  kind: string;
  mime: string;
  sizeBytes: number;
  originalName: string;
  publicUrl: string | null;
}

const KEY = ['perfil', 'empreiteiro', 'portfolio'] as const;

export function useEmpreiteiroPortfolio() {
  return useQuery<{ items: PortfolioItem[] }>({
    queryKey: KEY,
    queryFn: async () => {
      const res = await fetch('/api/perfil/empreiteiro/portfolio', { credentials: 'include' });
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useUpdatePortfolio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; titulo?: string; ordem?: number }[]) => {
      const res = await fetch('/api/perfil/empreiteiro/portfolio', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ items }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
