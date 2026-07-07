'use client';

import type { AdCreativeProps } from '../types';
import { CreativeImage } from './CreativeImage';

/**
 * Template `banner-imagem` (J24) — banner horizontal só com imagem clicável,
 * sem título nem barra de CTA. Pensado para as zonas de banner 728×90.
 */
export function BannerImagemTemplate({ titulo, criativoUrl, variant }: AdCreativeProps) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <CreativeImage
        src={criativoUrl}
        alt={titulo || 'Anúncio'}
        variant={variant}
        className="w-full h-full object-cover aspect-[728/90]"
      />
    </div>
  );
}
