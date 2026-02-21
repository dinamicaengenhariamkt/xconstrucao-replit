import { useQuery } from '@tanstack/react-query';
import type { AdminEmpreiteira, AdminEmpreiteiraObra } from '../types';
import { mockAdminEmpreiteiras, mockAdminEmpreiteiraObras } from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useAdminEmpreiteiras() {
  return useQuery<AdminEmpreiteira[]>({
    queryKey: ['admin', 'empreiteiras'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminEmpreiteiras;
      const res = await fetch('/api/admin/empreiteiras');
      if (!res.ok) throw new Error('Erro ao buscar empreiteiras');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAdminEmpreiteira(id: string) {
  return useQuery<AdminEmpreiteira | undefined>({
    queryKey: ['admin', 'empreiteiras', id],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminEmpreiteiras.find((e) => e.id === id);
      const res = await fetch(`/api/admin/empreiteiras/${id}`);
      if (!res.ok) throw new Error('Erro ao buscar empreiteira');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}

export function useAdminEmpreiteiraObras(id: string) {
  return useQuery<AdminEmpreiteiraObra[]>({
    queryKey: ['admin', 'empreiteiras', id, 'obras'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminEmpreiteiraObras[id] ?? [];
      const res = await fetch(`/api/admin/empreiteiras/${id}/obras`);
      if (!res.ok) throw new Error('Erro ao buscar obras da empreiteira');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}
