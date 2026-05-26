import { useQuery } from '@tanstack/react-query';
import type { AnuncioKpi, Campanha, Anunciante } from '../types';
import { mockAnuncioKpi, mockCampanhas, mockAnunciantes } from '../mocks';
import { isMockEnabled } from '@/features/shared/lib/mock-flag';

export { useZonasAnuncio } from '@features/shared/anuncios/hooks/use-zonas';

const ENABLE_MOCK = isMockEnabled();

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useAnuncioKpi() {
  return useQuery<AnuncioKpi>({
    queryKey: ['admin', 'anuncios', 'kpi'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAnuncioKpi;
      const res = await fetch('/api/admin/anuncios/kpi');
      if (!res.ok) throw new Error('Erro ao buscar KPIs de anúncios');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useCampanhas() {
  return useQuery<Campanha[]>({
    queryKey: ['admin', 'anuncios', 'campanhas'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockCampanhas;
      const res = await fetch('/api/admin/anuncios/campanhas');
      if (!res.ok) throw new Error('Erro ao buscar campanhas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAnunciantes() {
  return useQuery<Anunciante[]>({
    queryKey: ['admin', 'anuncios', 'anunciantes'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAnunciantes;
      const res = await fetch('/api/admin/anuncios/anunciantes');
      if (!res.ok) throw new Error('Erro ao buscar anunciantes');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
