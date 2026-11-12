'use client';

import Image from "next/image";
import Link from "next/link";
import { RiArrowRightLine } from "react-icons/ri";
import { usePublicConfig } from "@features/shared/hooks/use-public-config";
import { XGESTAO_LOGIN_HREF } from "@features/xgestao/routes";

const FOCO = "rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40";
const LINK = `text-sm text-slate-500 transition-colors hover:text-[#333333] dark:text-slate-400 dark:hover:text-white ${FOCO}`;
const TITULO = "text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400";

const COLUNAS: { titulo: string; links: { label: string; href: string }[] }[] = [
  {
    titulo: "Produto",
    links: [
      { label: "xgestão inteligente", href: "/xgestao-inteligente" },
      { label: "Instalar o app", href: "/instalar" },
      { label: "Acessar xgestão", href: XGESTAO_LOGIN_HREF },
    ],
  },
  {
    titulo: "Institucional",
    links: [
      { label: "Início", href: "/#inicio" },
      { label: "Soluções", href: "/#solucoes" },
    ],
  },
  {
    titulo: "Legal",
    links: [
      { label: "Termos de Uso", href: "/termos" },
      { label: "Política de Privacidade", href: "/politica-privacidade" },
    ],
  },
];

export function SiteFooter() {
  const { config } = usePublicConfig();
  return (
    <footer className="border-t border-black/5 bg-[#fcfcfc] px-6 pt-16 pb-8 dark:border-white/10 dark:bg-[#17191C]">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-10 md:grid-cols-4 md:gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className={`self-start ${FOCO}`}>
              <Image
                src="/images/logo-xconstrucao-horizontal-01.png"
                alt={config.nome}
                width={160}
                height={48}
                className="h-12 w-auto dark:invert"
              />
            </Link>
            {config.descricao && (
              <p className="max-w-xs text-xs leading-relaxed text-slate-500 dark:text-slate-400">{config.descricao}</p>
            )}
            <Link
              href="/cadastro?perfil=xgestao"
              className={`group mt-2 flex max-w-xs items-center justify-between gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 transition-colors hover:border-black/10 dark:border-white/10 dark:bg-[#22262A] dark:hover:border-white/20 ${FOCO}`}
            >
              <span className="flex flex-col">
                <span className="text-sm font-bold text-[#333333] dark:text-white">xgestão inteligente</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">Teste grátis por 3 meses</span>
              </span>
              <RiArrowRightLine
                aria-hidden="true"
                className="size-4 shrink-0 text-[#333333] transition-transform group-hover:translate-x-0.5 dark:text-white"
              />
            </Link>
          </div>

          {COLUNAS.map((coluna) => (
            <nav key={coluna.titulo} aria-label={coluna.titulo} className="flex flex-col gap-3">
              <p className={TITULO}>{coluna.titulo}</p>
              <ul className="flex flex-col gap-2.5">
                {coluna.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} prefetch={false} className={LINK}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-black/5 pt-6 text-center text-xs text-slate-500 md:flex-row md:text-left dark:border-white/10 dark:text-slate-400">
          <p>&copy; 2026 xconstrução.lab. Todos os direitos reservados.</p>
          <p>
            Desenvolvido por{" "}
            <a
              href="https://ramongomessilva.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium transition-colors hover:text-[#333333] dark:hover:text-white ${FOCO}`}
            >
              Ramon Gomes
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
