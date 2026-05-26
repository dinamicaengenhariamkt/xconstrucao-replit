import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { mockZonasAnuncio } from '@features/admin/anuncios/mocks';
import type { ZonaAnuncio } from '../types';
import { isMockEnabled } from '@/features/shared/lib/mock-flag';

const ENABLE_MOCK = isMockEnabled();

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useZonasAnuncio(): UseQueryResult<ZonaAnuncio[]> {
  return useQuery<ZonaAnuncio[]>({
    queryKey: ['anuncios', 'zonas'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockZonasAnuncio;
      const res = await fetch('/api/admin/anuncios/zonas');
      if (!res.ok) throw new Error('Erro ao buscar zonas de anúncios');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
