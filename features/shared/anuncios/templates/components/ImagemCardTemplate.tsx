'use client';

import type { AdCreativeProps } from '../types';
import { CreativeImage } from './CreativeImage';

/**
 * Template `imagem-card` (J24) — card vertical com imagem 4:3 + barra de CTA.
 * Markup idêntico ao miolo original do AdSidebarSlot (J16) para garantir zero
 * regressão visual nas zonas legadas. Apresentacional puro: o wrapper clicável
 * e o tracking ficam no slot/host.
 */
export function ImagemCardTemplate({ titulo, subtitulo, criativoUrl, ctaTexto, variant }: AdCreativeProps) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {criativoUrl ? (
        <CreativeImage
          src={criativoUrl}
          alt={titulo}
          variant={variant}
          className="aspect-[4/3] w-full object-cover"
        />
      ) : (
        <div className="aspect-[4/3] flex flex-col items-center justify-center gap-1 px-4 text-center">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{titulo}</span>
          {subtitulo && <span className="text-[11px] text-gray-500 dark:text-gray-400">{subtitulo}</span>}
        </div>
      )}
      <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 text-[10px] uppercase tracking-wide text-gray-400">
        {ctaTexto ?? 'Patrocinado'}
      </div>
    </div>
  );
}
