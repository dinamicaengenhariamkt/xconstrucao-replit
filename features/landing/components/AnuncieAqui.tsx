'use client';

import Link from 'next/link';
import { RiMegaphoneLine, RiArrowRightLine } from 'react-icons/ri';

/**
 * J23 — Seção "Anuncie na X-Construção" na landing. Editorial estático que CONVIDA
 * a anunciar (não confundir com a vitrine dinâmica "Mercado em Foco", J24, que
 * EXIBE anúncios). CTA leva ao cadastro de anunciante (outsider) — quem já tem
 * conta cai na própria área via login.
 */
export function AnuncieAqui() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-[1100px] mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white p-10 md:p-16">
          <div className="relative z-10 max-w-[640px]">
            <span className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-bold px-3 py-1 rounded-full mb-6">
              <RiMegaphoneLine className="w-4 h-4" /> Para anunciantes
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.03em] leading-tight mb-4">
              Anuncie onde o setor da construção está
            </h2>
            <p className="text-lg opacity-90 font-light mb-8">
              Coloque sua marca diante de contratantes e empreiteiros ativos na plataforma.
              Escolha os locais, monte o criativo com pré-visualização ao vivo e acompanhe tudo
              pelo seu painel — empreiteiro, contratante ou empresa parceira.
            </p>
            <Link
              href="/cadastro?perfil=anunciante"
              prefetch={false}
              className="bg-white text-primary font-bold h-14 px-10 rounded-full hover:scale-105 transition-transform inline-flex items-center justify-center gap-2"
              data-testid="link-anuncie-aqui"
            >
              Quero anunciar <RiArrowRightLine className="w-5 h-5" />
            </Link>
          </div>
          <RiMegaphoneLine className="absolute -right-10 -bottom-10 w-72 h-72 text-white/10" />
        </div>
      </div>
    </section>
  );
}
