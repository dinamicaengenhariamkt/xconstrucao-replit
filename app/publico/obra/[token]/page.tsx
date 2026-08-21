import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getClientIp, isRateLimited } from '@features/auth/api/rate-limit';
import { ObraPublicaShell } from '@features/xgestao/obra-publica/components/ObraPublicaShell';
import { buildObraPublicaView } from '@features/xgestao/obra-publica/server/projection';
import {
  recordObraShareView,
  resolveActiveObraShareToken,
} from '@features/xgestao/obra-publica/server/token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function ObraPublicaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const requestHeaders = await headers();
  const request = new Request('https://xgestao-public.invalid', { headers: requestHeaders });
  const ip = getClientIp(request);

  // Os dois limites reduzem enumeração ampla por IP e tentativas repetidas sobre
  // uma mesma capability. O mesmo 404 também protege o estado de rate limit.
  if (
    isRateLimited(`xgestao.share.public.ip:${ip}`, 120, 60_000) ||
    isRateLimited(`xgestao.share.public.token:${ip}:${token}`, 30, 60_000)
  ) {
    notFound();
  }

  const shared = await resolveActiveObraShareToken(token);
  if (!shared) notFound();

  const view = await buildObraPublicaView(shared.obraId);
  // Obra excluída, ou qualquer falha em montar a visão, não deve revelar se o
  // token já existiu.
  if (!view) notFound();

  void recordObraShareView(shared.linkId);
  return <ObraPublicaShell view={view} />;
}