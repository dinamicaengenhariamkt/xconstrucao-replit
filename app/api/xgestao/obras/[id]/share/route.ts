import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { canWriteObraContent, findObraAccess } from '@features/obras/api/access';
import { recordAudit } from '@features/auth/api/audit';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { assertXgestaoUser } from '@features/xgestao/lib/entitlement';
import {
  createOrRotateObraShareLink,
  getActiveObraShareLink,
  revokeObraShareLink,
  updateObraShareSecoes,
  type ObraShareLink,
} from '@features/xgestao/obra-publica/server/token';
import { SECOES_PUBLICAS, type SecaoPublica } from '@features/xgestao/obra-publica/secoes';

type RouteContext = { params: Promise<{ id: string }> };

// Só as chaves conhecidas entram; `strict` rejeita seção inventada em vez de
// ignorá-la em silêncio, para que um erro de digitação apareça no cliente.
const secoesSchema = z
  .object(Object.fromEntries(SECOES_PUBLICAS.map((secao) => [secao, z.boolean()])) as Record<
    SecaoPublica,
    z.ZodBoolean
  >)
  .strict();

const createShareSchema = z.object({
  expiraEm: z.string().datetime().optional().nullable(),
  secoes: secoesSchema.optional(),
});

const patchShareSchema = z.object({
  secoes: secoesSchema,
});

function response(data: unknown, status = 200) {
  const result = NextResponse.json(data, { status });
  setNoCacheHeaders(result);
  return result;
}

function sharePayload(link: ObraShareLink) {
  const path = `/publico/obra/${link.token}`;
  return {
    share: {
      path,
      expiraEm: link.expiraEm?.toISOString() ?? null,
      criadoEm: link.criadoEm.toISOString(),
      // Métricas de uso da capability: já eram gravadas por recordObraShareView,
      // faltava devolvê-las para o dono acompanhar se o cliente abriu o link.
      visualizacoes: link.visualizacoes,
      ultimoAcessoEm: link.ultimoAcessoEm?.toISOString() ?? null,
      secoes: link.secoes,
    },
  };
}

/**
 * Garante que a mutação é feita exclusivamente pelo empreiteiro xgestão dono
 * de uma obra própria; obra de marketplace nunca ganha link por esta API.
 */
async function requireXgestaoObraAccess(request: NextRequest, obraId: string) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return { error: guard.error, user: null };
  if (guard.user.role !== 'empreiteiro') {
    return { error: response({ message: 'Apenas empreiteiros xgestão podem gerenciar este link.' }, 403), user: null };
  }

  const entitlement = await assertXgestaoUser(guard.user.id);
  if (!entitlement) {
    return { error: response({ message: 'Seu acesso ao xgestão não está ativo.' }, 403), user: null };
  }

  const access = await findObraAccess(obraId, guard.user);
  if (
    !access ||
    !canWriteObraContent(access) ||
    access.obra.clienteId !== null ||
    access.obra.empreiteiraId !== entitlement.empreiteiraId
  ) {
    return { error: response({ message: 'Obra não encontrada.' }, 404), user: null };
  }
  return { error: null, user: guard.user };
}

/** GET retorna o link ativo existente sem girá-lo. */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireXgestaoObraAccess(request, id);
  if (access.error) return access.error;

  const link = await getActiveObraShareLink(id);
  return response(link ? sharePayload(link) : { share: null });
}

/** POST sempre cria uma nova capability e revoga a anterior. */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireXgestaoObraAccess(request, id);
  if (access.error || !access.user) return access.error!;

  const parsed = createShareSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return response({ message: 'Dados do link inválidos.' }, 400);
  }
  const expiraEm = parsed.data.expiraEm ? new Date(parsed.data.expiraEm) : null;
  const link = await createOrRotateObraShareLink(id, access.user.id, expiraEm, parsed.data.secoes ?? null);
  void recordAudit({
    actorId: access.user.id,
    action: 'xgestao.obra_share.emitido',
    payload: { obraId: id },
    request,
  });
  return response(sharePayload(link), 201);
}

/**
 * PATCH altera o que o link mostra, preservando o token: ajustar visibilidade
 * não pode invalidar o endereço que o cliente já tem salvo.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireXgestaoObraAccess(request, id);
  if (access.error || !access.user) return access.error!;

  const parsed = patchShareSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return response({ message: 'Seções inválidas.' }, 400);
  }

  const link = await updateObraShareSecoes(id, parsed.data.secoes);
  if (!link) return response({ message: 'Nenhum link ativo para esta obra.' }, 404);

  void recordAudit({
    actorId: access.user.id,
    action: 'xgestao.obra_share.secoes_alteradas',
    payload: { obraId: id, secoes: parsed.data.secoes },
    request,
  });
  return response(sharePayload(link));
}

/** DELETE revoga a capability ativa e preserva a linha para histórico. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireXgestaoObraAccess(request, id);
  if (access.error || !access.user) return access.error!;

  const revoked = await revokeObraShareLink(id);
  if (revoked) {
    void recordAudit({
      actorId: access.user.id,
      action: 'xgestao.obra_share.revogado',
      payload: { obraId: id },
      request,
    });
  }
  return response({ revoked });
}