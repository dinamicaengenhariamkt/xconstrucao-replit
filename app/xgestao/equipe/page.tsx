import { XGestaoEquipeView } from '@features/xgestao/components/XGestaoEquipeView';
import { getCurrentXGestaoEntitlement } from '@features/xgestao/lib/entitlement';
import { notFound } from 'next/navigation';

export default async function XGestaoEquipePage() {
  const entitlement = await getCurrentXGestaoEntitlement();
  if (entitlement?.papel !== 'dono') notFound();
  return <XGestaoEquipeView />;
}