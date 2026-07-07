import { NextRequest, NextResponse } from 'next/server';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { getContratanteDashboard } from '@features/contratante/dashboard/api/dashboard-server';

/**
 * GET /api/contratante/dashboard — KPIs + evolução + fases + pendências reais
 * do contratante autenticado (J17). Substitui os mocks do dashboard.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== 'contratante' && guard.user.role !== 'superadmin') {
    const r = NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const payload = await getContratanteDashboard(guard.user.id);
  const r = NextResponse.json(payload);
  setNoCacheHeaders(r);
  return r;
}
