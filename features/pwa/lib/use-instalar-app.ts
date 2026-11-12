'use client';

/**
 * PWA — estado da instalação do app.
 *
 * O Android dispara `beforeinstallprompt` uma vez, cedo, às vezes antes de o
 * React montar. Por isso quem escuta é o script curto do layout raiz
 * (`captura-instalacao.ts`), que guarda o evento em `window.__pwaEvento`;
 * aqui só lemos e reagimos ao aviso.
 */
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { detectarPlataforma, ehSafariIos, type PlataformaInstalacao } from './plataforma';
import { AVISO_PWA as AVISO } from './captura-instalacao';

interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __pwaEvento?: EventoInstalacao | null;
    __pwaInstalado?: boolean;
  }
}

function assinar(aviso: () => void) {
  window.addEventListener(AVISO, aviso);
  return () => window.removeEventListener(AVISO, aviso);
}

/** Aberto pelo ícone na tela inicial (Android ou iPhone). */
export function rodandoComoApp(): boolean {
  if (typeof window === 'undefined') return false;
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches;
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return Boolean(standalone || iosStandalone);
}

export type ResultadoInstalacao = 'aceito' | 'recusado' | 'indisponivel';

export function useInstalarApp() {
  const evento = useSyncExternalStore(assinar, () => window.__pwaEvento ?? null, () => null);
  const instaladoAgora = useSyncExternalStore(assinar, () => window.__pwaInstalado === true, () => false);
  // Plataforma só no cliente: no servidor não há user agent confiável, e assim
  // o primeiro render bate com o do servidor (nada aparece até saber).
  const [plataforma, setPlataforma] = useState<PlataformaInstalacao | null>(null);
  const [safariIos, setSafariIos] = useState(true);
  const [comoApp, setComoApp] = useState(false);

  useEffect(() => {
    setPlataforma(detectarPlataforma(navigator.userAgent, navigator.maxTouchPoints ?? 0));
    setSafariIos(ehSafariIos(navigator.userAgent));
    setComoApp(rodandoComoApp());
  }, []);

  const instalar = useCallback(async (): Promise<ResultadoInstalacao> => {
    const e = window.__pwaEvento;
    if (!e) return 'indisponivel';
    await e.prompt();
    const { outcome } = await e.userChoice;
    // O evento só serve uma vez.
    window.__pwaEvento = null;
    window.dispatchEvent(new Event(AVISO));
    return outcome === 'accepted' ? 'aceito' : 'recusado';
  }, []);

  return {
    plataforma,
    safariIos,
    /** Já está dentro do app instalado: não há o que oferecer. */
    comoApp,
    /** Acabou de instalar nesta visita. */
    instaladoAgora,
    /** Android/Chrome com o atalho do navegador pronto: 1 toque instala. */
    podeInstalarDireto: evento !== null,
    instalar,
  };
}
