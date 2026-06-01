import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarDisputasAdmin } from "@features/disputas/disputas-service";

/**
 * GET /api/admin/disputas — fila de disputas para mediação (admin/superadmin).
 * Retorna o shape consumido por features/admin/disputas (mapeado do DB).
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const rows = await listarDisputasAdmin();
  const r = NextResponse.json(rows);
  setNoCacheHeaders(r);
  return r;
}
