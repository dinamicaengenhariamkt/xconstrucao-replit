import { Suspense } from 'react';
import { XGestaoConfiguracoesView } from '@features/xgestao/components/XGestaoConfiguracoesView';

export default function XGestaoConfiguracoesPage() {
  return (
    <Suspense fallback={<div className="p-10 text-sm text-muted-foreground">Carregando configurações…</div>}>
      <XGestaoConfiguracoesView />
    </Suspense>
  );
}