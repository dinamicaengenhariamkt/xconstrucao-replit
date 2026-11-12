'use client';

/**
 * Site público (12/11/2026) — topo das páginas internas do site (termos,
 * privacidade, login e afins): imagem de fundo suave, breadcrumb e título.
 * O breadcrumb é um <nav aria-label="Trilha"> com <ol>, e a página atual
 * leva aria-current="page".
 */
import type { ReactNode } from 'react';
import Link from 'next/link';
import { RiArrowRightSLine, RiHome5Line } from 'react-icons/ri';

export interface Migalha {
  nome: string;
  href?: string;
}

export function SiteBreadcrumb({ itens, className = '' }: { itens: Migalha[]; className?: string }) {
  return (
    <nav aria-label="Trilha" className={className} data-testid="site-breadcrumb">
      <ol className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-full border border-black/5 bg-white/80 px-2 py-1 text-xs font-semibold text-slate-500 shadow-sm backdrop-blur-md sm:text-sm dark:border-white/10 dark:bg-[#1C1F22]/70 dark:text-slate-400">
        <li>
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-black/5 hover:text-[#333333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-white/40"
          >
            <RiHome5Line className="size-4" aria-hidden="true" />
            Início
          </Link>
        </li>
        {itens.map((item, i) => {
          const atual = i === itens.length - 1;
          return (
            <li key={`${item.nome}-${i}`} className="inline-flex min-w-0 items-center gap-1">
              <RiArrowRightSLine className="size-4 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden="true" />
              {item.href && !atual ? (
                <Link
                  href={item.href}
                  prefetch={false}
                  className="truncate rounded-full px-2 py-1 transition-colors hover:bg-black/5 hover:text-[#333333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {item.nome}
                </Link>
              ) : (
                <span aria-current={atual ? 'page' : undefined} className="truncate px-2 py-1 text-[#101819] dark:text-white">
                  {item.nome}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Topo com imagem de fundo, breadcrumb e título. `children` entra abaixo do título. */
export function SiteHeroPagina({
  migalhas,
  titulo,
  icone,
  children,
  compacto = false,
}: {
  migalhas: Migalha[];
  titulo?: ReactNode;
  icone?: ReactNode;
  children?: ReactNode;
  /** Login e telas de conta: faixa mais baixa, o card vem logo abaixo. */
  compacto?: boolean;
}) {
  return (
    <section
      className={`relative overflow-hidden px-6 ${compacto ? 'pt-28 pb-8 md:pt-32 md:pb-10' : 'pt-32 pb-14 md:pt-40 md:pb-20'}`}
      data-testid="site-hero-pagina"
    >
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-[0.10] dark:opacity-[0.07]"
          style={{ backgroundImage: 'url("/images/background-homepage.png")' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0)_0%,rgba(255,255,255,0.65)_60%,#ffffff_100%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(28,31,34,0)_0%,rgba(28,31,34,0.7)_60%,#1C1F22_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-white dark:to-[#1C1F22]" />
      </div>
      <div className="relative z-10 mx-auto flex max-w-[900px] flex-col items-center gap-5 text-center">
        <SiteBreadcrumb itens={migalhas} />
        {titulo && (
          <h1 className="flex items-center gap-3 text-4xl font-extrabold leading-[1] tracking-[-0.04em] sm:text-5xl md:text-6xl">
            {icone}
            <span>{titulo}</span>
          </h1>
        )}
        {children}
      </div>
    </section>
  );
}
