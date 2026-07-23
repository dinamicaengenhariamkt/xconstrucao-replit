import { NextRequest, NextResponse } from 'next/server';
import { db } from '@shared/db/db';
import { obras } from '@shared/db/schema';
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { computeHealthMapForObras } from '@features/shared/health/summary-server';

/**
 * GET /api/admin/obras-health — mapa `obraId → ObraHealth` real de TODAS as obras
 * (J57). Espelha `/api/contratante/obras-health`, mas sem escopo por cliente:
 * o admin vê a saúde do portfólio inteiro. Reusa `computeHealthMapForObras`.
 *
 * A tela de admin consome este mapa para o badge de saúde por linha e o KPI de
 * obras em atraso/risco — casando com o card de saúde do contratante.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const rows = await db.select({ id: obras.id }).from(obras);
  const map = await computeHealthMapForObras(rows.map((o) => o.id));
  const r = NextResponse.json(map);
  setNoCacheHeaders(r);
  return r;
}
