import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ZonaAnuncio } from '../types';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useZonasAnuncio(): UseQueryResult<ZonaAnuncio[]> {
  return useQuery<ZonaAnuncio[]>({
    queryKey: ['anuncios', 'zonas'],
    queryFn: async () => {
      const res = await fetch('/api/admin/anuncios/zonas');
      if (!res.ok) throw new Error('Erro ao buscar zonas de anúncios');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
