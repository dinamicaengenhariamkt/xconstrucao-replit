import { useQuery } from '@tanstack/react-query';
import type { AdminCliente, AdminClienteObra } from '../types';
import { mockAdminClientes, mockAdminClienteObras } from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useAdminClientes() {
  return useQuery<AdminCliente[]>({
    queryKey: ['admin', 'clientes'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminClientes;
      const res = await fetch('/api/admin/clientes');
      if (!res.ok) throw new Error('Erro ao buscar clientes');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAdminCliente(id: string) {
  return useQuery<AdminCliente | undefined>({
    queryKey: ['admin', 'clientes', id],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminClientes.find((c) => c.id === id);
      const res = await fetch(`/api/admin/clientes/${id}`);
      if (!res.ok) throw new Error('Erro ao buscar cliente');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}

export function useAdminClienteObras(id: string) {
  return useQuery<AdminClienteObra[]>({
    queryKey: ['admin', 'clientes', id, 'obras'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminClienteObras[id] ?? [];
      const res = await fetch(`/api/admin/clientes/${id}/obras`);
      if (!res.ok) throw new Error('Erro ao buscar obras do cliente');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}
