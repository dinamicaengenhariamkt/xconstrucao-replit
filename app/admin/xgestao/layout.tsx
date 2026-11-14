import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { PainelTemaRaiz } from '@features/xgestao/tema/PainelTemaRaiz';
import { ScriptTemaPainel } from '@features/xgestao/tema/ScriptTemaPainel';

// PRD 55 — admin do xgestão com o mesmo tema do painel (Claro, Escuro, Automático).
// O resto do /admin (marketplace) continua só claro: o tema sai ao deixar esta área.
export const viewport: Viewport = { colorScheme: 'only light' };

export default function AdminXgestaoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ScriptTemaPainel />
      <PainelTemaRaiz>{children}</PainelTemaRaiz>
    </>
  );
}
