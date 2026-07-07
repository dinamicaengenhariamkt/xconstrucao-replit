import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, obras } from '@shared/db/schema';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { computeHealthMapForObras } from '@features/shared/health/summary-server';

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

  const [emp] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, guard.user.id));
  if (!emp) {
    const r = NextResponse.json({});
    setNoCacheHeaders(r);
    return r;
  }
  const rows = await db.select({ id: obras.id }).from(obras).where(eq(obras.empreiteiraId, emp.id));
  const map = await computeHealthMapForObras(rows.map((o) => o.id));
  const r = NextResponse.json(map);
  setNoCacheHeaders(r);
  return r;
}
