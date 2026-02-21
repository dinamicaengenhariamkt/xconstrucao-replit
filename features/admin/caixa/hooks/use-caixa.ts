import { useQuery } from '@tanstack/react-query';
import type { CaixaResumo, Movimentacao } from '../types';
import { mockCaixaResumo, mockMovimentacoes } from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useCaixaResumo() {
  return useQuery<CaixaResumo>({
    queryKey: ['admin', 'caixa', 'resumo'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockCaixaResumo;
      const res = await fetch('/api/admin/caixa/resumo');
      if (!res.ok) throw new Error('Erro ao buscar resumo do caixa');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useMovimentacoes() {
  return useQuery<Movimentacao[]>({
    queryKey: ['admin', 'caixa', 'movimentacoes'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockMovimentacoes;
      const res = await fetch('/api/admin/caixa/movimentacoes');
      if (!res.ok) throw new Error('Erro ao buscar movimentações');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
