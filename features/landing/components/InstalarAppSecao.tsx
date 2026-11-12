'use client';

import { InstalarAppPassos } from '@features/pwa/components/InstalarAppPassos';
import { Reveal } from '@features/landing/components/Reveal';

/** PWA — seção "Leve o xgestão no celular" da home. */
export function InstalarAppSecao() {
  return (
    <section
      id="instalar-app"
      className="py-24 md:py-32 px-6 scroll-mt-24"
      data-testid="secao-instalar-app"
    >
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 md:gap-12 lg:grid-cols-2">
        <Reveal className="max-w-[600px]">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 break-words">
            Leve o xgestão <br />
            no celular
          </h2>
          <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400">
            Instale o app em poucos segundos, direto do navegador. Sem loja e sem configurar nada:
            o ícone vai para a tela inicial e abre direto nas suas obras.
          </p>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="relative overflow-hidden rounded-3xl border border-black/[0.04] bg-[#F4F5F5] p-6 shadow-[0_24px_60px_-32px_rgba(0,0,0,0.18)] sm:p-8 md:p-10 dark:border-white/5 dark:bg-[#2A2D30]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/70 blur-3xl dark:bg-white/5"
            />
            <div className="relative">
              <InstalarAppPassos />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
