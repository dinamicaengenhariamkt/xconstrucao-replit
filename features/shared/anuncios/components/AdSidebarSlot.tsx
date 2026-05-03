'use client';

import { useActiveAdForZone } from '../hooks/use-active-ad';
import type { AnuncioZonaId } from '../types';

interface Props {
  zoneId: AnuncioZonaId;
}

export function AdSidebarSlot({ zoneId }: Props) {
  const { zona } = useActiveAdForZone(zoneId);
  if (!zona) return null;

  return (
    <div className="mx-3 my-3" data-testid={`ad-slot-${zoneId}`}>
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <div className="aspect-[4/3] flex items-center justify-center px-4 text-center text-xs text-gray-500 dark:text-gray-400">
          {zona.anuncioAtual ?? zona.nome}
        </div>
        <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 text-[10px] uppercase tracking-wide text-gray-400">
          Patrocinado
        </div>
      </div>
    </div>
  );
}
