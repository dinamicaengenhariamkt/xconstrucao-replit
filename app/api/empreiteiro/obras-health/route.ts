import { NextRequest, NextResponse } from 'next/server';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { computeHealthMapForObras } from '@features/shared/health/summary-server';
import { canAccessObraArea, findObraAccess } from '@features/obras/api/access';
import { obras } from '@shared/db/schema';
import { resolverEscopoObrasEmpreiteiro } from '@features/empreiteiro/api/escopo-obras';

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

  const scope = await resolverEscopoObrasEmpreiteiro(guard.user.id);
  if (!scope) {
    const r = NextResponse.json({});
    setNoCacheHeaders(r);
    return r;
  }
  if (scope.allowedIds !== null && scope.allowedIds.length === 0) {
    const r = NextResponse.json({});
    setNoCacheHeaders(r);
    return r;
  }
  const rows = await db.select({ id: obras.id }).from(obras).where(and(
    eq(obras.empreiteiraId, scope.empreiteiraId),
    ...(scope.isMember ? [
      isNull(obras.clienteId),
    ] : []),
    ...(scope.allowedIds === null ? [] : [inArray(obras.id, scope.allowedIds)]),
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
