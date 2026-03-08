import { useQuery } from '@tanstack/react-query';
import type { AdminObra } from '../types/list';
import { mockAdminObras } from '../mocks/list.mock';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useAdminObras() {
  return useQuery<AdminObra[]>({
    queryKey: ['admin', 'obras'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminObras;
      const res = await fetch('/api/admin/obras');
      if (!res.ok) throw new Error('Erro ao buscar obras');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
