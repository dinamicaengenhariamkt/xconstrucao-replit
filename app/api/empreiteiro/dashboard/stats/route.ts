import { NextRequest, NextResponse } from 'next/server';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { getEmpreiteiroDashboardStats } from '@features/empreiteiro/dashboard/api/dashboard-server';
import type { DashboardPeriodo } from '@features/empreiteiro/dashboard/types';

const PERIODOS: DashboardPeriodo[] = ['7dias', '30dias', '3meses', '12meses'];

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== 'empreiteiro' && guard.user.role !== 'superadmin') {
    const r = NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const raw = request.nextUrl.searchParams.get('periodo');
  const periodo = PERIODOS.includes(raw as DashboardPeriodo) ? (raw as DashboardPeriodo) : '30dias';

  const stats = await getEmpreiteiroDashboardStats(guard.user.id, periodo);
  const r = NextResponse.json(stats);
  setNoCacheHeaders(r);
  return r;
}
