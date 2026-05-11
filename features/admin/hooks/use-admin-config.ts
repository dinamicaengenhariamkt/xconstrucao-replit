'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type AdminConfigKey = 'geral' | 'plataforma' | 'seguranca' | 'integracoes' | 'notificacoes';

export type AdminConfigMap = Record<AdminConfigKey, Record<string, unknown>>;

const KEY = ['admin', 'configuracoes'] as const;

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export function useAdminConfig() {
  return useQuery<AdminConfigMap>({
    queryKey: KEY,
    queryFn: () => getJSON<AdminConfigMap>('/api/admin/configuracoes'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateAdminConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { chave: AdminConfigKey; valor: Record<string, unknown> }) => {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json() as Promise<{ chave: AdminConfigKey; valor: Record<string, unknown> }>;
    },
    onSuccess: (row) => {
      const cur = qc.getQueryData<AdminConfigMap>(KEY);
      if (cur) qc.setQueryData<AdminConfigMap>(KEY, { ...cur, [row.chave]: row.valor });
      else qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
