'use client';

import { useEffect, useRef, useState } from 'react';
import { useAnuncioAtivo, registrarEventoAnuncio } from '../hooks/use-anuncio-ativo';
import type { AnuncioZonaId } from '../types';

interface Props {
  zoneId: AnuncioZonaId;
}

/**
 * Slot de anúncio (J16). Busca o anúncio ativo da zona no endpoint público,
 * renderiza o criativo real (imagem) com fallback de texto, registra UMA
 * impressão quando entra na viewport (IntersectionObserver) e um clique ao ser
 * acionado. Some graciosamente (`return null`) quando não há anúncio ativo.
 */
export function AdSidebarSlot({ zoneId }: Props) {
  const { data: anuncio } = useAnuncioAtivo(zoneId);
  const ref = useRef<HTMLDivElement | null>(null);
  const [impresso, setImpresso] = useState(false);

  useEffect(() => {
    if (!anuncio || impresso || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setImpresso(true);
            void registrarEventoAnuncio(anuncio.id, 'impressao');
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [anuncio, impresso]);

  if (!anuncio) return null;

  const ativo = anuncio;
  // Só permite http(s) — fecha a porta para javascript:/data: (defesa em profundidade).
  const ctaSeguro = ativo.ctaUrl && /^https?:\/\//i.test(ativo.ctaUrl) ? ativo.ctaUrl : null;
  const clicavel = Boolean(ctaSeguro);

  function handleClick() {
    void registrarEventoAnuncio(ativo.id, 'clique');
    if (ctaSeguro) {
      window.open(ctaSeguro, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className="mx-3 my-3" data-testid={`ad-slot-${zoneId}`} ref={ref}>
      <div
        role={clicavel ? 'link' : undefined}
        tabIndex={clicavel ? 0 : undefined}
        onClick={clicavel ? handleClick : undefined}
        onKeyDown={
          clicavel
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClick();
                }
              }
            : undefined
        }
        className={`rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 overflow-hidden ${
          clicavel ? 'cursor-pointer transition-shadow hover:shadow-md' : ''
        }`}
      >
        {ativo.criativoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ativo.criativoUrl}
            alt={ativo.titulo}
            className="aspect-[4/3] w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="aspect-[4/3] flex flex-col items-center justify-center gap-1 px-4 text-center">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{ativo.titulo}</span>
            {ativo.subtitulo && (
              <span className="text-[11px] text-gray-500 dark:text-gray-400">{ativo.subtitulo}</span>
            )}
          </div>
        )}
        <div className="px-3 py-1.5 border-t border-gray-100 dark:border-gray-800 text-[10px] uppercase tracking-wide text-gray-400">
          {ativo.ctaTexto ?? 'Patrocinado'}
        </div>
      </div>
    </div>
  );
}
