import { NextRequest, NextResponse } from 'next/server';
import { requireVerifiedUser, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import {
  getEmpreiteiroHealthSummary,
  getEmpreiteiroProfitSummary,
} from '@features/empreiteiro/dashboard/api/dashboard-server';

/**
 * GET /api/empreiteiro/dashboard/summary — saúde + lucro consolidados das obras
 * do empreiteiro (J17). Cálculo real, substitui getMockHealth/ProfitSummary.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== 'empreiteiro' && guard.user.role !== 'superadmin') {
    const r = NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const [health, profit] = await Promise.all([
    getEmpreiteiroHealthSummary(guard.user.id),
    getEmpreiteiroProfitSummary(guard.user.id),
  ]);

  const r = NextResponse.json({ health, profit });
  setNoCacheHeaders(r);
  return r;
}
