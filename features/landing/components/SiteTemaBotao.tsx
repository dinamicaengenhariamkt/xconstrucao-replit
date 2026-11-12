'use client';

import { RiMoonLine, RiSunLine } from 'react-icons/ri';
import { useSiteTemaOpcional } from '../lib/site-tema';

/** Botão claro/escuro do menu do site. Fora de `SiteTemaRaiz` não aparece. */
export function SiteTemaBotao({ className = '' }: { className?: string }) {
  const ctx = useSiteTemaOpcional();
  if (!ctx) return null;
  const escuro = ctx.tema === 'dark';
  return (
    <button
      type="button"
      onClick={ctx.alternar}
      aria-label={escuro ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={escuro ? 'Tema claro' : 'Tema escuro'}
      className={`inline-flex size-9 items-center justify-center rounded-full text-[#333333] transition-colors hover:bg-black/5 dark:text-white dark:hover:bg-white/10 ${className}`}
      data-testid="button-tema-site"
    >
      {escuro ? <RiSunLine className="size-[18px]" /> : <RiMoonLine className="size-[18px]" />}
    </button>
  );
}
