import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getDisputasKPI } from "@features/disputas/disputas-service";

/** GET /api/admin/disputas/kpi — indicadores da fila de disputas. */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const kpi = await getDisputasKPI();
  const r = NextResponse.json(kpi);
  setNoCacheHeaders(r);
  return r;
}
