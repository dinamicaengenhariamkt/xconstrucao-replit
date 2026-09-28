import { NextRequest } from 'next/server';
import { z } from 'zod';
import { recordAudit } from '@features/auth/api/audit';
import { revokeObraShareLink, updateObraShareLink } from '@features/xgestao/obra-publica/server/token';
import {
  nomeLinkSchema,
  requireXgestaoObraAccess,
  secoesSchema,
  shareResponse,
  sharePayload,
} from '@features/xgestao/obra-publica/server/share-api';

type RouteContext = { params: Promise<{ id: string; linkId: string }> };

const patchShareSchema = z
  .object({ secoes: secoesSchema.optional(), nome: nomeLinkSchema.optional() })
  .refine((body) => body.secoes !== undefined || body.nome !== undefined);

/**
 * PATCH altera o que um link mostra, ou o nome dele, preservando o token:
 * ajustar visibilidade não pode invalidar o endereço que o cliente já tem.
 *
 * O `linkId` só é aceito junto da obra da URL, e a obra só depois do guard de
 * dono — um id de link de outra obra cai no mesmo 404 de link inexistente.
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id, linkId } = await context.params;
  const access = await requireXgestaoObraAccess(request, id);
  if (access.error || !access.user) return access.error!;

  const parsed = patchShareSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return shareResponse({ message: 'Dados do link inválidos.' }, 400);
  }

  const link = await updateObraShareLink(id, linkId, parsed.data);
  if (!link) return shareResponse({ message: 'Link não encontrado.' }, 404);

  void recordAudit({
    actorId: access.user.id,
    action: 'xgestao.obra_share.secoes_alteradas',
    payload: { obraId: id, linkId, ...parsed.data },
    request,
  });
  return shareResponse({ share: sharePayload(link) });
}

/** DELETE revoga um link e preserva a linha para histórico; os demais seguem. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id, linkId } = await context.params;
  const access = await requireXgestaoObraAccess(request, id);
  if (access.error || !access.user) return access.error!;

  const revoked = await revokeObraShareLink(id, linkId);
  if (!revoked) return shareResponse({ message: 'Link não encontrado.' }, 404);

  void recordAudit({
    actorId: access.user.id,
    action: 'xgestao.obra_share.revogado',
    payload: { obraId: id, linkId },
    request,
  });
  return shareResponse({ revoked: true });
}
