'use client';

import { useCallback, useEffect, useState } from 'react';

/** Chave do card de 3 passos que o tour substituiu. Migrada, não reaproveitada. */
const CHAVE_LEGADA = 'xgestao-operation-guide-dismissed';

function chaveDe(tour: string): string {
  return `xgestao-tour-${tour}-visto`;
}

/**
 * Controla a exibição de um tour guiado: abre sozinho na primeira visita e
 * pode ser reaberto a qualquer momento pelo botão de ajuda.
 *
 * A preferência vive no navegador — trocar de dispositivo reexibe o tour uma
 * vez, o que custa um clique e evita coluna nova só para isso.
 */
export function useGuidedTour(tour: string, habilitado = true) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!habilitado || typeof window === 'undefined') return;

    // Quem já dispensou o guia antigo do console não deve rever o tour por
    // conta da substituição.
    if (tour === 'console' && window.localStorage.getItem(CHAVE_LEGADA) === '1') {
      window.localStorage.setItem(chaveDe(tour), '1');
      window.localStorage.removeItem(CHAVE_LEGADA);
      return;
    }

    if (window.localStorage.getItem(chaveDe(tour)) !== '1') setOpen(true);
  }, [habilitado, tour]);

  const fechar = useCallback(() => {
    setOpen(false);
    if (typeof window !== 'undefined') window.localStorage.setItem(chaveDe(tour), '1');
  }, [tour]);

  const abrir = useCallback(() => setOpen(true), []);

  return { open, abrir, fechar };
}
