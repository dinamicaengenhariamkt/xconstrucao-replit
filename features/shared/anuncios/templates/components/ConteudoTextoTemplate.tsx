'use client';

import type { AdCreativeProps } from '../types';
import { CreativeImage } from './CreativeImage';

interface Conteudo {
  texto?: string;
  fonte?: string;
  badge?: string;
}

/**
 * Template `conteudo-texto` (J24) — card editorial/advertorial: imagem de capa
 * opcional + etiqueta + autor/fonte + título + texto. Substitui o card
 * "Conteúdo de Marca" antes hardcoded na home.
 */
export function ConteudoTextoTemplate({ titulo, criativoUrl, conteudo, ctaTexto, ctaUrl, variant }: AdCreativeProps) {
  const c = (conteudo ?? {}) as Conteudo;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg">
      {criativoUrl && (
        <CreativeImage src={criativoUrl} alt={titulo} variant={variant} className="aspect-video w-full object-cover" />
      )}
      <div className="p-6 flex flex-col gap-3 flex-1">
        {c.badge && (
          <span className="self-start bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
            {c.badge}
          </span>
        )}
        {c.fonte && (
          <p className="text-slate-500 text-sm">
            Por <span className="font-semibold text-slate-700 dark:text-slate-300">{c.fonte}</span>
          </p>
        )}
        {titulo && (
          <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{titulo}</h3>
        )}
        {c.texto && (
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{c.texto}</p>
        )}
        {ctaTexto && ctaUrl && (
          <span className="mt-auto pt-2 text-sm font-semibold text-primary">{ctaTexto} →</span>
        )}
      </div>
    </div>
  );
}
