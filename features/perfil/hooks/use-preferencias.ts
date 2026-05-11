'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface UserPreferencias {
  userId: string;
  notificacoes: Record<string, boolean>;
  privacidade: Record<string, boolean>;
  updatedAt: string;
}

const KEY = ['perfil', 'preferencias'] as const;

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

async function patchJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

export function usePreferencias() {
  return useQuery<UserPreferencias>({
    queryKey: KEY,
    queryFn: () => getJSON<UserPreferencias>('/api/perfil/preferencias'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePreferencias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { notificacoes?: Record<string, boolean>; privacidade?: Record<string, boolean> }) =>
      patchJSON<UserPreferencias>('/api/perfil/preferencias', data),
    onSuccess: (data) => qc.setQueryData(KEY, data),
  });
}

export interface SessaoAtiva {
  id: string;
  userAgent: string | null;
  ip: string | null;
  lastUsedAt: string | null;
  createdAt: string | null;
  current: boolean;
}

const SESSOES_KEY = ['perfil', 'sessoes'] as const;

export function useSessoes() {
  return useQuery<SessaoAtiva[]>({
    queryKey: SESSOES_KEY,
    queryFn: async () => {
      const data = await getJSON<{ sessoes: SessaoAtiva[] }>('/api/perfil/sessoes');
      return data.sessoes ?? [];
    },
    staleTime: 60 * 1000,
  });
}

export function useRevokeSessao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/perfil/sessoes/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SESSOES_KEY }),
  });
}
