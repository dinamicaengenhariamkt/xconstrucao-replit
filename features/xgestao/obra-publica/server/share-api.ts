import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { canWriteObraContent, findObraAccess } from '@features/obras/api/access';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { assertXgestaoUser } from '@features/xgestao/lib/entitlement';
import { SECOES_PUBLICAS, type SecaoPublica } from '../secoes';
import type { ObraShareLink } from './token';

/**
 * Peças comuns às rotas `share/` e `share/[linkId]/` (XG30). Moram fora de
 * `app/` porque um `route.ts` só pode exportar handlers HTTP.
 */

// Só as chaves conhecidas entram; `strict` rejeita seção inventada em vez de
// ignorá-la em silêncio, para que um erro de digitação apareça no cliente.
export const secoesSchema = z
  .object(Object.fromEntries(SECOES_PUBLICAS.map((secao) => [secao, z.boolean()])) as Record<
    SecaoPublica,
    z.ZodBoolean
  >)
  .strict();

/** Nome do link, visível só para o dono ("Cliente", "Arquiteto"…). */
export const nomeLinkSchema = z.string().trim().min(1).max(40);

export function shareResponse(data: unknown, status = 200) {
  const result = NextResponse.json(data, { status });
  setNoCacheHeaders(result);
  return result;
}

export function sharePayload(link: ObraShareLink) {
  return {
    id: link.id,
    nome: link.nome,
    path: `/publico/obra/${link.token}`,
    expiraEm: link.expiraEm?.toISOString() ?? null,
    criadoEm: link.criadoEm.toISOString(),
    // Métricas de uso da capability: o dono acompanha se o cliente abriu o link.
    visualizacoes: link.visualizacoes,
    ultimoAcessoEm: link.ultimoAcessoEm?.toISOString() ?? null,
    secoes: link.secoes,
  };
}

/**
 * Garante que a mutação é feita exclusivamente pelo empreiteiro xgestão dono
 * de uma obra própria; obra de marketplace nunca ganha link por esta API.
 */
export async function requireXgestaoObraAccess(request: NextRequest, obraId: string) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return { error: guard.error, user: null };
  if (guard.user.role !== 'empreiteiro') {
    return { error: shareResponse({ message: 'Apenas empreiteiros xgestão podem gerenciar este link.' }, 403), user: null };
  }

  const entitlement = await assertXgestaoUser(guard.user.id);
  if (!entitlement) {
    return { error: shareResponse({ message: 'Seu acesso ao xgestão não está ativo.' }, 403), user: null };
  }

  const access = await findObraAccess(obraId, guard.user);
  if (
    !access ||
    !canWriteObraContent(access) ||
    access.obra.clienteId !== null ||
    access.obra.empreiteiraId !== entitlement.empreiteiraId
  ) {
    return { error: shareResponse({ message: 'Obra não encontrada.' }, 404), user: null };
  }
  return { error: null, user: guard.user };
}
