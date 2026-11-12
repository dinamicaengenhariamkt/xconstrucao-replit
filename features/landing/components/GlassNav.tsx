"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { RiMenuLine } from 'react-icons/ri';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@shared/components/ui/sheet";
import type { GlassNavProps } from '../types';
import { usePublicConfig } from '@features/shared/hooks/use-public-config';
import { XGESTAO_LOGIN_HREF } from '@features/xgestao/routes';
import { SiteTemaBotao } from './SiteTemaBotao';
import { useSiteTemaOpcional } from '../lib/site-tema';

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40";

/** Link do menu desktop; quando ativo, fica em negrito. */
function linkDesktop(ativo: boolean) {
  return `relative rounded-full text-sm transition-opacity hover:opacity-70 ${FOCO} ${
    ativo
      ? "font-semibold"
      : "font-medium"
  }`;
}

function linkMobile(ativo: boolean) {
  return `text-lg font-medium py-3 px-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors ${FOCO} ${
    ativo ? "bg-black/[0.04] dark:bg-white/[0.06]" : ""
  }`;
}

/**
 * XG16 — a prop `showAdminButton` foi aposentada: o link público para a área
 * administrativa saiu da navegação. Não é uma barreira de segurança (o
 * `proxy.ts` e as rotas de API é que protegem `/admin/*`), e sim a decisão de
 * não anunciar publicamente uma área que o produto ativo não usa.
 *
 * Site público (12/11/2026): botão de tema (só aparece dentro de
 * `SiteTemaRaiz`), ponto no link ativo e sombra maior ao rolar.
 */
export function GlassNav({ showAccessButton = true }: GlassNavProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { config, isLoading } = usePublicConfig();
  const temaSite = useSiteTemaOpcional();
  const sheetEscuro = temaSite?.tema === 'dark';
  const accessHref = config.marketplaceVisivel
    ? "/acesso-plataforma"
    : XGESTAO_LOGIN_HREF;
  const accessLabel = config.marketplaceVisivel ? "Acesso à Plataforma" : "Acessar xgestão";
  const inicioAtivo = pathname === "/";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const aoRolar = () => setScrolled(window.scrollY > 8);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  const navContent = (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-6">
      <nav
        className="flex items-center justify-between w-full max-w-[1200px] px-8 py-3 rounded-full border border-white/20 dark:border-white/10 backdrop-blur-xl bg-white/70 dark:bg-[#1C1F22]/70 text-[#101819] dark:text-white transition-shadow duration-300"
        style={{
          boxShadow: scrolled
            ? "0 18px 50px -14px rgba(0, 0, 0, 0.16)"
            : "0 10px 40px -10px rgba(0, 0, 0, 0.04)",
        }}
      >
        <Link href="/" className={`rounded-lg ${FOCO}`}>
          <Image
            src="/images/logo-xconstrucao-horizontal-01.png"
            alt="XConstrução"
            width={320}
            height={96}
            style={{ height: "2.5rem", width: "auto" }}
            className="dark:invert"
            priority
          />
        </Link>

        {mounted && (
          <SheetTrigger asChild className="md:hidden">
            <button className={`p-2 rounded-full hover:opacity-70 transition-opacity ${FOCO}`} aria-label="Menu">
              <RiMenuLine className="h-6 w-6" />
            </button>
          </SheetTrigger>
        )}
        {!mounted && (
          <button className="md:hidden p-2 hover:opacity-70 transition-opacity" aria-label="Menu">
            <RiMenuLine className="h-6 w-6" />
          </button>
        )}

        <div className="hidden md:flex items-center gap-10">
          <Link
            className={linkDesktop(inicioAtivo)}
            href="/#inicio"
            aria-current={inicioAtivo ? "page" : undefined}
            data-testid="link-nav-inicio"
          >
            Início
          </Link>
          <Link
            className={linkDesktop(false)}
            href="/#solucoes"
            data-testid="link-nav-solucoes"
          >
            Soluções
          </Link>
          {!isLoading && config.marketplaceVisivel && (
            <Link
              className={linkDesktop(false)}
              href="/#projetos"
              data-testid="link-nav-projetos"
            >
              Projetos
            </Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <SiteTemaBotao className={FOCO} />
          {showAccessButton && isLoading && (
            <div
              className="h-9 w-40 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"
              aria-label="Carregando acesso"
              role="status"
            />
          )}
          {showAccessButton && !isLoading && (
            <Link
              href={accessHref}
              prefetch={false}
              className={`bg-[#333333] text-white dark:bg-white dark:text-[#1C1F22] text-sm font-bold px-6 py-2 rounded-full hover:brightness-110 transition-all ${FOCO}`}
              data-testid="link-acesso-plataforma"
            >
              {accessLabel}
            </Link>
          )}
        </div>
      </nav>
    </header>
  );

  if (!mounted) {
    return navContent;
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {navContent}

      <SheetContent
        side="left"
        className={`w-[280px] backdrop-blur-xl border-r ${
          sheetEscuro
            ? "bg-[#1C1F22]/95 text-white border-white/10"
            : "bg-white/95 dark:bg-[#1C1F22]/95 border-white/20"
        }`}
      >
        <SheetTitle className="sr-only">Menu de navegação</SheetTitle>
        <div className={`flex flex-col h-full pt-8 ${sheetEscuro ? "dark" : ""}`}>
          <nav className="flex flex-col gap-2">
            <Link
              href="/#inicio"
              onClick={() => setIsOpen(false)}
              className={linkMobile(inicioAtivo)}
              aria-current={inicioAtivo ? "page" : undefined}
              data-testid="link-nav-inicio-mobile"
            >
              Início
            </Link>
            <Link
              href="/#solucoes"
              onClick={() => setIsOpen(false)}
              className={linkMobile(false)}
              data-testid="link-nav-solucoes-mobile"
            >
              Soluções
            </Link>
            {!isLoading && config.marketplaceVisivel && (
              <Link
                href="/#projetos"
                onClick={() => setIsOpen(false)}
                className={linkMobile(false)}
                data-testid="link-nav-projetos-mobile"
              >
                Projetos
              </Link>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-black/5 dark:border-white/10 flex flex-col gap-4">
            {temaSite && (
              <div className="flex items-center justify-between px-4">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tema</span>
                <SiteTemaBotao className={FOCO} />
              </div>
            )}
            {showAccessButton && isLoading && (
              <div
                className="h-11 w-full rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse"
                aria-label="Carregando acesso"
                role="status"
              />
            )}
            {showAccessButton && !isLoading && (
              <Link
                href={accessHref}
                prefetch={false}
                className={`block w-full bg-[#333333] text-white dark:bg-white dark:text-[#1C1F22] text-sm font-bold px-6 py-3 rounded-full hover:brightness-110 transition-all text-center ${FOCO}`}
                data-testid="link-acesso-plataforma-mobile"
              >
                {accessLabel}
              </Link>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
