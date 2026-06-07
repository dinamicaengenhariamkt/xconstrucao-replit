'use client';

import { useQuery } from '@tanstack/react-query';
import { AdCreativeCard } from '@features/shared/anuncios/components/AdCreativeCard';
import { useAnuncioTracking } from '@features/shared/anuncios/hooks/use-anuncio-tracking';
import type { AnuncioAtivo } from '@features/shared/anuncios/hooks/use-anuncio-ativo';
import type { TemplateId } from '@features/shared/anuncios/templates/types';

/**
 * Seção "Mercado em Foco" da home (J24) — vitrine pública dinâmica. Consome os
 * anúncios ativos da zona `home-mercado` e renderiza cada um pelo seu template
 * (AdCreativeCard real). Some inteira (`return null`) quando vazia ou quando o
 * toggle de seção está off (endpoint retorna []), sem deixar buraco/CLS.
 */
export function MercadoEmFoco() {
  const { data } = useQuery<AnuncioAtivo[]>({
    queryKey: ['anuncios', 'home', 'home-mercado'],
    queryFn: async () => {
      const res = await fetch('/api/anuncios?zona=home-mercado');
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  const ads = data ?? [];
  if (ads.length === 0) return null;

  return (
    <section className="py-32 px-6 bg-[#fcfcfc] dark:bg-background-dark/50">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-20 gap-8">
          <div className="max-w-[600px]">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Mercado em <br /> Foco
            </h2>
            <p className="text-xl text-slate-500">
              Informações e conteúdos selecionados para profissionais da construção.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
          {ads.map((ad) => (
            <MercadoCard key={ad.id} ad={ad} />
          ))}
        </div>
      </div>
    </section>
  );
}

function MercadoCard({ ad }: { ad: AnuncioAtivo }) {
  const ctaSeguro = ad.ctaUrl && /^https?:\/\//i.test(ad.ctaUrl) ? ad.ctaUrl : null;
  const { ref, clicavel, onClick } = useAnuncioTracking(ad.id, ctaSeguro);

  return (
    <div
      ref={ref}
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
      className={clicavel ? 'cursor-pointer transition-transform hover:-translate-y-1' : ''}
    >
      <AdCreativeCard
        template={(ad.template ?? 'imagem-card') as TemplateId}
        titulo={ad.titulo}
        subtitulo={ad.subtitulo}
        criativoUrl={ad.criativoUrl}
        ctaUrl={ctaSeguro}
        ctaTexto={ad.ctaTexto}
        conteudo={ad.conteudo ?? null}
        variant="live"
      />
    </div>
  );
}
