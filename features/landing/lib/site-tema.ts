'use client';

/**
 * Site público (11/11/2026) — tema claro/escuro só das páginas de fora (home,
 * xgestão inteligente, termos e privacidade).
 *
 * Fica separado do tema do app (`@shared/store/theme-store`) de propósito: a
 * escolha feita no site não pode deixar o painel do xgestão escuro. Funciona
 * porque a variante `dark` do Tailwind é "dentro de um `.dark`"
 * (`@custom-variant dark (&:is(.dark *))`), então basta a classe no invólucro
 * da página (`SiteTemaRaiz`), sem tocar no `<html>`.
 */
import { createContext, useCallback, useContext, useSyncExternalStore } from 'react';

export type SiteTema = 'light' | 'dark';

const CHAVE = 'xconstrucao-site-tema';
const AVISO = 'site-tema:mudou';

function ler(): SiteTema {
  try {
    return window.localStorage.getItem(CHAVE) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function assinar(aviso: () => void) {
  window.addEventListener(AVISO, aviso);
  window.addEventListener('storage', aviso);
  return () => {
    window.removeEventListener(AVISO, aviso);
    window.removeEventListener('storage', aviso);
  };
}

export function useSiteTema() {
  const tema = useSyncExternalStore<SiteTema>(assinar, ler, () => 'light');
  const alternar = useCallback(() => {
    try {
      window.localStorage.setItem(CHAVE, ler() === 'dark' ? 'light' : 'dark');
    } catch {
      // Sem storage: o tema não fica guardado, mas o aviso abaixo não muda nada.
    }
    window.dispatchEvent(new Event(AVISO));
  }, []);
  return { tema, alternar };
}

/** Presente só dentro de `SiteTemaRaiz`: o botão de tema aparece só nessas páginas. */
export const SiteTemaContexto = createContext<ReturnType<typeof useSiteTema> | null>(null);

export function useSiteTemaOpcional() {
  return useContext(SiteTemaContexto);
}
