'use client';

import { useEffect, useRef, useState } from 'react';
import { registrarEventoAnuncio } from './use-anuncio-ativo';

/**
 * Tracking de um criativo (J24): registra UMA impressão quando entra na viewport
 * (IntersectionObserver, threshold 0.5) e expõe um `onClick` que registra o
 * clique e abre o CTA. Reusado pelo AdSidebarSlot e pelos cards da vitrine da
 * home — cada criativo rastreia de forma independente.
 *
 * `ctaUrl` deve chegar já sanitizado (http(s) ou null). Quando null, `clicavel`
 * é false e nenhum `onClick` é exposto.
 */
export function useAnuncioTracking(anuncioId: string | null, ctaUrl: string | null) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [impresso, setImpresso] = useState(false);

  useEffect(() => {
    if (!anuncioId || impresso || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setImpresso(true);
            void registrarEventoAnuncio(anuncioId, 'impressao');
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [anuncioId, impresso]);

  const clicavel = Boolean(ctaUrl);

  function handleClick() {
    if (!anuncioId) return;
    void registrarEventoAnuncio(anuncioId, 'clique');
    if (ctaUrl) window.open(ctaUrl, '_blank', 'noopener,noreferrer');
  }

  return { ref, clicavel, onClick: handleClick };
}
