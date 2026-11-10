import { NextRequest } from 'next/server';
import { z } from 'zod';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { detalheAssinanteXgestao } from '@features/xgestao/admin/server/assinantes';
import { definirContaInterna } from '@features/xgestao/admin/server/conta-interna';
import { getClientIp } from '@features/auth/api/rate-limit';

/** Ids de usuário são UUID; qualquer outra coisa nem chega ao banco. */
const ID_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/xgestao/assinantes/:id — XG44, visão completa de um
 * responsável xgestão (`:id` = id do usuário titular). 404 para membro de
 * equipe, conta de marketplace ou id inexistente, sem distinguir entre eles.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!ID_VALIDO.test(id)) return adminJson({ message: 'Assinante não encontrado.' }, 404);
  const detalhe = await detalheAssinanteXgestao(id);
  if (!detalhe) return adminJson({ message: 'Assinante não encontrado.' }, 404);
  return adminJson(detalhe);
}

const patchSchema = z.object({ contaInterna: z.boolean() }).strict();

/**
 * PATCH /api/admin/xgestao/assinantes/:id — ADM-02: marca ou desmarca a conta
 * interna/teste. Só administrador; a mudança fica em `audit_logs`.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  const { id } = await params;
  if (!ID_VALIDO.test(id)) return adminJson({ message: 'Assinante não encontrado.' }, 404);
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return adminJson({ message: 'Informe contaInterna (true ou false).' }, 400);
  const resultado = await definirContaInterna({
    userId: id,
    contaInterna: parsed.data.contaInterna,
    actorId: guard.user.id,
    ip: getClientIp(request),
    userAgent: request.headers.get('user-agent'),
  });
  if (!resultado) return adminJson({ message: 'Assinante não encontrado.' }, 404);
  return adminJson(resultado);
}
