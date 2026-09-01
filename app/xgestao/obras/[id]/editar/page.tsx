import { and, eq, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '@shared/db/db';
import { obras } from '@shared/db/schema';
import { EditarObraPage } from '@features/xgestao/components/EditarObraPage';
import { getCurrentXGestaoEntitlement } from '@features/xgestao/lib/entitlement';

export default async function XGestaoEditarObraRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const entitlement = await getCurrentXGestaoEntitlement();
  if (!entitlement) notFound();

  const { id } = await params;
  const [obraPropria] = await db
    .select({ id: obras.id })
    .from(obras)
    .where(and(
      eq(obras.id, id),
      eq(obras.empreiteiraId, entitlement.empreiteiraId),
      isNull(obras.clienteId),
    ))
    .limit(1);

  if (!obraPropria) notFound();

  return <EditarObraPage obraId={id} />;
}