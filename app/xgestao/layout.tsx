import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { XGestaoLayout } from '@features/xgestao/components/XGestaoLayout';
import { getCurrentXGestaoEntitlement } from '@features/xgestao/lib/entitlement';

export default async function XGestaoRouteLayout({ children }: { children: ReactNode }) {
  const entitlement = await getCurrentXGestaoEntitlement();
  if (!entitlement) {
    redirect('/login?perfil=xgestao&next=%2Fxgestao%2Fobras');
  }

  return <XGestaoLayout>{children}</XGestaoLayout>;
}