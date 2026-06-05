import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { clientes, obras } from '@shared/db/schema';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { computeHealthMapForObras } from '@features/shared/health/summary-server';

/**
 * GET /api/contratante/obras-health — mapa `obraId → ObraHealth` real das obras
 * do contratante (J17). Usado pela lista de obras para filtro/card de saúde,
 * substituindo `getMockHealth`/`getMockHealthSummary`.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== 'contratante' && guard.user.role !== 'superadmin') {
    const r = NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
  if (!cli) {
    const r = NextResponse.json({});
    setNoCacheHeaders(r);
    return r;
  }
  const rows = await db.select({ id: obras.id }).from(obras).where(eq(obras.clienteId, cli.id));
  const map = await computeHealthMapForObras(rows.map((o) => o.id));
  const r = NextResponse.json(map);
  setNoCacheHeaders(r);
  return r;
}
