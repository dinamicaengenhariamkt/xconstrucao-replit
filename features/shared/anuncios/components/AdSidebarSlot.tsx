'use client';

import { useAnuncioAtivo } from '../hooks/use-anuncio-ativo';
import { useAnuncioTracking } from '../hooks/use-anuncio-tracking';
import { AdCreativeCard } from './AdCreativeCard';
import type { TemplateId } from '../templates/types';
import type { AnuncioZonaId } from '../types';

interface Props {
  zoneId: AnuncioZonaId;
}

/**
 * Slot de anúncio (J16/J24). Busca o anúncio ativo da zona no endpoint público,
 * renderiza o criativo pelo seu **template** (via AdCreativeCard), registra UMA
 * impressão ao entrar na viewport e um clique ao ser acionado. Some
 * graciosamente (`return null`) quando não há anúncio ativo.
 *
 * O wrapper clicável e o tracking ficam aqui; o AdCreativeCard é apresentacional
 * puro. Para o template default (`imagem-card`) o render é idêntico ao da J16.
 */
export function AdSidebarSlot({ zoneId }: Props) {
  const { data: anuncio } = useAnuncioAtivo(zoneId);

  // Só permite http(s) — fecha a porta para javascript:/data: (defesa em profundidade).
  const ctaSeguro =
    anuncio?.ctaUrl && /^https?:\/\//i.test(anuncio.ctaUrl) ? anuncio.ctaUrl : null;
  const { ref, clicavel, onClick } = useAnuncioTracking(anuncio?.id ?? null, ctaSeguro);

  if (!anuncio) return null;

  return (
    <div className="mx-3 my-3" data-testid={`ad-slot-${zoneId}`} ref={ref}>
      <div
        role={clicavel ? 'link' : undefined}
        tabIndex={clicavel ? 0 : undefined}
        onClick={clicavel ? onClick : undefined}
        onKeyDown={
          clicavel
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
        className={clicavel ? 'cursor-pointer transition-shadow hover:shadow-md rounded-xl' : ''}
      >
        <AdCreativeCard
          template={(anuncio.template ?? 'imagem-card') as TemplateId}
          titulo={anuncio.titulo}
          subtitulo={anuncio.subtitulo}
          criativoUrl={anuncio.criativoUrl}
          ctaUrl={ctaSeguro}
          ctaTexto={anuncio.ctaTexto}
          conteudo={anuncio.conteudo ?? null}
          variant="live"
        />
      </div>
    </div>
  );
}
