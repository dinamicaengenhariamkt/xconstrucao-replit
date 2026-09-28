import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, obras, xgestaoMembros, xgestaoMembroObras } from '@shared/db/schema';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { computeHealthMapForObras } from '@features/shared/health/summary-server';
import { listarIdsObrasPermitidas, resolverEmpresaDoUsuario } from '@features/xgestao/equipe/server/access';
import { canAccessObraArea, findObraAccess } from '@features/obras/api/access';

/**
 * GET /api/empreiteiro/obras-health — mapa `obraId → ObraHealth` real das obras
 * da empreiteira do usuário (J17). Substitui o mock na lista de obras.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== 'empreiteiro' && guard.user.role !== 'superadmin') {
    const r = NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const resolvedEmpresa = await resolverEmpresaDoUsuario(guard.user.id);
  const [membershipRow] = await db
    .select({
      id: xgestaoMembros.id,
      empreiteiraId: xgestaoMembros.empreiteiraId,
      papel: xgestaoMembros.papel,
    })
    .from(xgestaoMembros)
    .innerJoin(empreiteiras, eq(empreiteiras.id, xgestaoMembros.empreiteiraId))
    .where(and(eq(xgestaoMembros.userId, guard.user.id), eq(xgestaoMembros.status, 'ativo')))
    .limit(1);
  const membership = resolvedEmpresa ? membershipRow : undefined;
  const empresa = membership
    ? { empreiteiraId: membership.empreiteiraId, papel: membership.papel }
    : resolvedEmpresa;
  if (!empresa) {
    const r = NextResponse.json({});
    setNoCacheHeaders(r);
    return r;
  }
  const isOwner = !membership;
  const permitidas = membership
    ? membership.papel === 'gestor'
      ? null
      : (await db.select({ obraId: xgestaoMembroObras.obraId })
        .from(xgestaoMembroObras)
        .where(and(
          eq(xgestaoMembroObras.membroId, membership.id),
          eq(xgestaoMembroObras.empreiteiraId, membership.empreiteiraId),
        ))).map((grant) => grant.obraId)
    : await listarIdsObrasPermitidas(guard.user.id, empresa.empreiteiraId);
  const rows = await db.select({ id: obras.id }).from(obras).where(and(
    eq(obras.empreiteiraId, empresa.empreiteiraId),
    ...(isOwner ? [] : [
      isNull(obras.clienteId),
      ...(permitidas === null ? [] : [inArray(obras.id, permitidas)]),
    ]),
  ));
  const readable = await Promise.all(rows.map(async ({ id }) => {
    const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
    if (
      !access ||
      !canAccessObraArea(access, "cronograma") ||
      !canAccessObraArea(access, "ocorrencias") ||
      !canAccessObraArea(access, "financeiro") ||
      (access.role === "empreiteiro" && access.xgestaoCategoriasFinanceiroPermitidas != null)
    ) return null;
    return id;
  }));
  const map = await computeHealthMapForObras(readable.filter((id): id is string => id !== null));
  const r = NextResponse.json(map);
  setNoCacheHeaders(r);
  return r;
}
