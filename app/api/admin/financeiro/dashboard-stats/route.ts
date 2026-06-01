import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getDashboardStats } from "@features/admin/financeiro/api/caixa-service";

/** GET /api/admin/financeiro/dashboard-stats — KPIs financeiros reais do dashboard. */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json(await getDashboardStats());
  setNoCacheHeaders(r);
  return r;
}
