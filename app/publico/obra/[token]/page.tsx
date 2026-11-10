import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getClientIp, isRateLimited } from '@features/auth/api/rate-limit';
import type { Metadata } from 'next';
import { ObraPublicaShell } from '@features/xgestao/obra-publica/components/ObraPublicaShell';
import { ObraPublicaIndisponivel } from '@features/xgestao/obra-publica/components/ObraPublicaIndisponivel';
import { tokenComFormatoValido } from '@features/xgestao/obra-publica/token-formato';
import { buildObraPublicaView } from '@features/xgestao/obra-publica/server/projection';
import {
  recordObraShareView,
  resolveActiveObraShareToken,
} from '@features/xgestao/obra-publica/server/token';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

// Reforça o layout: nenhuma variante desta página (obra, indisponível, 404) indexa.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ObraPublicaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  // PUB-03 — formato antes do rate limit: lixo na URL não grava chave no Map
  // nem chega ao banco. O 404 é o mesmo de um token inexistente.
  if (!tokenComFormatoValido(token)) notFound();
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
  // Conta da empresa em somente leitura: aviso neutro, sem dado da obra e sem
  // contar visualização. Volta sozinho quando a conta regulariza.
  if (shared.indisponivel) return <ObraPublicaIndisponivel />;

  const view = await buildObraPublicaView(shared.obraId, shared.secoes);
  // Obra excluída, ou qualquer falha em montar a visão, não deve revelar se o
  // token já existiu.
  if (!view) notFound();

  void recordObraShareView(shared.linkId);
  return <ObraPublicaShell view={view} />;
}