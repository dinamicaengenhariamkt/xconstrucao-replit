import { Suspense } from 'react';
import { XGestaoConfiguracoesView } from '@features/xgestao/components/XGestaoConfiguracoesView';
import { getCurrentXGestaoEntitlement } from '@features/xgestao/lib/entitlement';

export default async function XGestaoConfiguracoesPage() {
  // XG37 — o layout já garantiu o acesso; aqui só decide o que o membro enxerga.
  const entitlement = await getCurrentXGestaoEntitlement();
  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Carregando configurações…</div>}>
      <XGestaoConfiguracoesView isOwner={entitlement?.papel === 'dono'} />
    </Suspense>
  );
}
