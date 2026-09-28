import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { XGestaoLayout } from '@features/xgestao/components/XGestaoLayout';
import { getCurrentXGestaoEntitlement } from '@features/xgestao/lib/entitlement';
import { XGESTAO_LOGIN_HREF } from '@features/xgestao/routes';

export default async function XGestaoRouteLayout({ children }: { children: ReactNode }) {
  const entitlement = await getCurrentXGestaoEntitlement();
  if (!entitlement) {
    redirect(XGESTAO_LOGIN_HREF);
  }

  return <XGestaoLayout isOwner={entitlement.papel === 'dono'}>{children}</XGestaoLayout>;
}