import { NextRequest } from 'next/server';
import { z } from 'zod';
import { recordAudit } from '@features/auth/api/audit';
import {
  createObraShareLink,
  LIMITE_LINKS_ATIVOS,
  LimiteLinksAtingidoError,
  listActiveObraShareLinks,
} from '@features/xgestao/obra-publica/server/token';
import {
  nomeLinkSchema,
  requireXgestaoObraAccess,
  secoesSchema,
  shareResponse,
  sharePayload,
} from '@features/xgestao/obra-publica/server/share-api';

type RouteContext = { params: Promise<{ id: string }> };

const createShareSchema = z.object({
  // Opcional para não quebrar quem ainda chama sem nome: vira "Cliente", o
  // mesmo default dos links emitidos antes da XG30.
  nome: nomeLinkSchema.optional(),
  expiraEm: z.string().datetime().optional().nullable(),
  secoes: secoesSchema.optional(),
});

/** GET lista os links ativos da obra, sem girar nenhum (XG30: um por público). */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireXgestaoObraAccess(request, id);
  if (access.error) return access.error;

  const links = await listActiveObraShareLinks(id);
  return shareResponse({ shares: links.map(sharePayload), limite: LIMITE_LINKS_ATIVOS });
}

/**
 * POST cria um link novo e **não** revoga os existentes: o do arquiteto não
 * pode derrubar o que o cliente já tem salvo. Trocar um endereço é revogar
 * (`DELETE share/[linkId]`) e criar outro.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireXgestaoObraAccess(request, id);
  if (access.error || !access.user) return access.error!;

  const parsed = createShareSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return shareResponse({ message: 'Dados do link inválidos.' }, 400);
  }

  try {
    const link = await createObraShareLink(id, access.user.id, {
      nome: parsed.data.nome ?? 'Cliente',
      expiraEm: parsed.data.expiraEm ? new Date(parsed.data.expiraEm) : null,
      secoes: parsed.data.secoes ?? null,
    });
    void recordAudit({
      actorId: access.user.id,
      action: 'xgestao.obra_share.emitido',
      payload: { obraId: id, linkId: link.id, nome: link.nome },
      request,
    });
    return shareResponse({ share: sharePayload(link) }, 201);
  } catch (error) {
    if (error instanceof LimiteLinksAtingidoError) {
      return shareResponse(
        { message: `Esta obra já tem ${LIMITE_LINKS_ATIVOS} links ativos. Revogue um para criar outro.` },
        409,
      );
    }
    throw error;
  }
}
