import type { Metadata, Viewport } from 'next';
import { PainelTemaRaiz } from '@features/xgestao/tema/PainelTemaRaiz';
import { ScriptTemaPainel } from '@features/xgestao/tema/ScriptTemaPainel';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// PRD 55 — o link público segue o celular de quem abre (claro ou escuro), sem botão.
export const viewport: Viewport = { colorScheme: 'only light' };

/** Área pública propositalmente sem a navegação de áreas autenticadas. */
export default function PublicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScriptTemaPainel fixo="automatico" />
      <PainelTemaRaiz fixo="automatico">{children}</PainelTemaRaiz>
    </>
  );
}