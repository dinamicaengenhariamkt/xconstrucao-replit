import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { redirect } from 'next/navigation';
import { XGestaoLayout } from '@features/xgestao/components/XGestaoLayout';
import { getCurrentXGestaoEntitlement } from '@features/xgestao/lib/entitlement';
import { XGESTAO_LOGIN_HREF } from '@features/xgestao/routes';
import { iniciarTesteAutomatico } from '@features/xgestao/teste/server/teste-service';
import { onboardingXgestaoPendente } from '@features/onboarding/server/documento-pendente';
import { PainelTemaRaiz } from '@features/xgestao/tema/PainelTemaRaiz';
import { ScriptTemaPainel } from '@features/xgestao/tema/ScriptTemaPainel';

// PRD 55 — o painel declara o próprio esquema de cores: sem isso o "escuro forçado"
// do navegador do celular invertia o painel (logo some). O script do tema troca
// para `dark` quando o painel está no nosso escuro.
export const viewport: Viewport = { colorScheme: 'only light' };

export default async function XGestaoRouteLayout({ children }: { children: ReactNode }) {
  const entitlement = await getCurrentXGestaoEntitlement();
  if (!entitlement) {
    redirect(XGESTAO_LOGIN_HREF);
  }

  // XG43 — o teste de 90 dias começa no primeiro acesso do responsável. Não
  // dispara para membros nem quando o admin está visualizando a conta. Só
  // escreve uma vez: depois disso a conta já tem assinatura e a função sai.
  if (entitlement.papel === 'dono' && !entitlement.visualizadoPorAdmin) {
    // 10/11/2026 — sem wizard concluído e sem CPF/CNPJ, o teste ainda não
    // começa: o documento vem antes, para a regra de um teste por documento.
    if (await onboardingXgestaoPendente(entitlement.userId)) redirect('/onboarding');
    await iniciarTesteAutomatico(entitlement.userId);
  }

  return (
    <>
      <ScriptTemaPainel />
      <PainelTemaRaiz>
        <XGestaoLayout isOwner={entitlement.papel === 'dono'}>{children}</XGestaoLayout>
      </PainelTemaRaiz>
    </>
  );
}