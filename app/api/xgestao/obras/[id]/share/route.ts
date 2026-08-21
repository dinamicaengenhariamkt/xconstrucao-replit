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
  type ObraShareLink,
} from '@features/xgestao/obra-publica/server/token';

type RouteContext = { params: Promise<{ id: string }> };
const createShareSchema = z.object({
  expiraEm: z.string().datetime().optional().nullable(),
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
    return response({ message: 'Data de expiração inválida.' }, 400);
  }
  const expiraEm = parsed.data.expiraEm ? new Date(parsed.data.expiraEm) : null;
  const link = await createOrRotateObraShareLink(id, access.user.id, expiraEm);
  void recordAudit({
    actorId: access.user.id,
    action: 'xgestao.obra_share.emitido',
    payload: { obraId: id },
    request,
  });
  return response(sharePayload(link), 201);
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