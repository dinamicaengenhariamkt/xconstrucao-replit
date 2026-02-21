import { useQuery } from '@tanstack/react-query';
import type { Saida, SaidaResumo } from '../types';
import { mockSaidaResumo, mockSaidas } from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useSaidaResumo() {
  return useQuery<SaidaResumo>({
    queryKey: ['admin', 'saidas', 'resumo'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockSaidaResumo;
      const res = await fetch('/api/admin/saidas/resumo');
      if (!res.ok) throw new Error('Erro ao buscar resumo de saídas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useSaidas() {
  return useQuery<Saida[]>({
    queryKey: ['admin', 'saidas'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockSaidas;
      const res = await fetch('/api/admin/saidas');
      if (!res.ok) throw new Error('Erro ao buscar saídas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
