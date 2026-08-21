import { NextRequest, NextResponse } from 'next/server';
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from '@features/auth/api/auth-utils';
import { getXgestaoAdminDashboard } from '@features/xgestao/admin/server/dashboard';

/** GET /api/admin/xgestao — visão operacional mínima do produto xgestão. */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (!isAdminLike(guard.user.role)) {
    const response = NextResponse.json({ message: 'Apenas administradores.' }, { status: 403 });
    setNoCacheHeaders(response);
    return response;
  }

  const response = NextResponse.json(await getXgestaoAdminDashboard());
  setNoCacheHeaders(response);
  return response;
}