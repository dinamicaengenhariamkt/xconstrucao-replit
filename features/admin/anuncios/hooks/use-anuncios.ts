import { useQuery } from '@tanstack/react-query';
import type { Anuncio, AnuncioResumo } from '../types';
import { mockAnuncios, mockAnuncioResumo } from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useAdminAnuncios() {
  return useQuery<Anuncio[]>({
    queryKey: ['admin', 'anuncios'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAnuncios;
      const res = await fetch('/api/admin/anuncios');
      if (!res.ok) throw new Error('Erro ao buscar anúncios');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAdminAnuncioResumo() {
  return useQuery<AnuncioResumo>({
    queryKey: ['admin', 'anuncios', 'resumo'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAnuncioResumo;
      const res = await fetch('/api/admin/anuncios/resumo');
      if (!res.ok) throw new Error('Erro ao buscar resumo de anúncios');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
