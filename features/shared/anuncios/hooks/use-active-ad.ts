import { useZonasAnuncio } from './use-zonas';
import type { AnuncioZonaId, ZonaAnuncio } from '../types';

export function useActiveAdForZone(zoneId: AnuncioZonaId): { zona: ZonaAnuncio | null } {
  const { data } = useZonasAnuncio();
  const zona = data?.find((z) => z.id === zoneId);
  return { zona: zona && zona.status === 'ativo' ? zona : null };
}
