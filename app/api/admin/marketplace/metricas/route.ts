import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders, isAdminLike } from "@features/auth/api/auth-utils";
import { getMetricasSplit } from "@features/marketplace/metricas-service";

/**
 * GET /api/admin/marketplace/metricas — J50
 * Métricas de split (repasse, comissão, pendentes) + saques, para o painel admin.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json(await getMetricasSplit());
  setNoCacheHeaders(r);
  return r;
}
