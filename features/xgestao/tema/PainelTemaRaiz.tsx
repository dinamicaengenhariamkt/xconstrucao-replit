'use client';

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import {
  aplicarTemaNoDocumento,
  assinarMudancasDeTema,
  celularNoEscuro,
  gravarPreferencia,
  lerPreferencia,
  PREFERENCIA_PADRAO,
  resolverTema,
  type PreferenciaTema,
  type TemaResolvido,
} from './painel-tema';

interface PainelTemaValor {
  preferencia: PreferenciaTema;
  tema: TemaResolvido;
  escolher: (preferencia: PreferenciaTema) => void;
}

const PainelTemaContexto = createContext<PainelTemaValor | null>(null);

const nada = () => () => {};

/**
 * Liga o tema do painel enquanto a tela estiver aberta. Ver `painel-tema.ts`.
 * `fixo` trava a preferência (link público: sempre Automático, sem botão).
 */
export function PainelTemaRaiz({ children, fixo }: { children: ReactNode; fixo?: PreferenciaTema }) {
  const guardada = useSyncExternalStore<PreferenciaTema>(
    fixo ? nada : assinarMudancasDeTema,
    lerPreferencia,
    () => PREFERENCIA_PADRAO,
  );
  const escuroNoCelular = useSyncExternalStore(assinarMudancasDeTema, celularNoEscuro, () => false);
  const preferencia = fixo ?? guardada;
  const tema = resolverTema(preferencia, escuroNoCelular);

  useEffect(() => aplicarTemaNoDocumento(tema), [tema]);

  const escolher = useCallback((nova: PreferenciaTema) => gravarPreferencia(nova), []);

  return (
    <PainelTemaContexto.Provider value={{ preferencia, tema, escolher }}>
      {children}
    </PainelTemaContexto.Provider>
  );
}

/** Tema do painel dentro de `PainelTemaRaiz`. */
export function usePainelTema() {
  return useContext(PainelTemaContexto);
}

/**
 * Preferência guardada, sem depender do contexto: o topo do admin fica fora do
 * `PainelTemaRaiz` (que está no layout de /admin/xgestao), mas a escolha feita
 * nele chega à raiz pelo mesmo aviso.
 */
export function usePreferenciaTema() {
  const preferencia = useSyncExternalStore<PreferenciaTema>(
    assinarMudancasDeTema,
    lerPreferencia,
    () => PREFERENCIA_PADRAO,
  );
  const escolher = useCallback((nova: PreferenciaTema) => gravarPreferencia(nova), []);
  return { preferencia, escolher };
}
