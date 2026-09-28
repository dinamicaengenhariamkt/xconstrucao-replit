import { and, eq, isNull } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '@shared/db/db';
import { obras } from '@shared/db/schema';
import { ObraConsoleView } from '@features/empreiteiro/minhas-obras/components/ObraConsoleView';
import { getCurrentXGestaoEntitlement } from '@features/xgestao/lib/entitlement';
import { resolverAcessoObraXgestao } from '@features/xgestao/equipe/server/access';

export default async function XGestaoObraDetalhePage({
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

  const permission = obraPropria ? await resolverAcessoObraXgestao(entitlement.userId, id) : null;
  if (!permission) notFound();

  return (
    <ObraConsoleView
      basePath="/xgestao/obras"
      showMarketplaceContact={false}
      allowOwnWorkEdit={permission === 'editar'}
    />
  );
}