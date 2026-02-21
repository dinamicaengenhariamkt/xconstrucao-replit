import { useQuery } from '@tanstack/react-query';
import type { Entrada, EntradaResumo } from '../types';
import { mockEntradaResumo, mockEntradas } from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useEntradaResumo() {
  return useQuery<EntradaResumo>({
    queryKey: ['admin', 'entradas', 'resumo'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockEntradaResumo;
      const res = await fetch('/api/admin/entradas/resumo');
      if (!res.ok) throw new Error('Erro ao buscar resumo de entradas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useEntradas() {
  return useQuery<Entrada[]>({
    queryKey: ['admin', 'entradas'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockEntradas;
      const res = await fetch('/api/admin/entradas');
      if (!res.ok) throw new Error('Erro ao buscar entradas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
