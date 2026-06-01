import { useQuery } from '@tanstack/react-query';
import type { AnuncioKpi, Campanha, Anunciante } from '../types';

export { useZonasAnuncio } from '@features/shared/anuncios/hooks/use-zonas';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useAnuncioKpi() {
  return useQuery<AnuncioKpi>({
    queryKey: ['admin', 'anuncios', 'kpi'],
    queryFn: async () => {
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
      const res = await fetch('/api/admin/anuncios/anunciantes');
      if (!res.ok) throw new Error('Erro ao buscar anunciantes');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
