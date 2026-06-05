import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarAuditoriaAdmin } from "@features/admin/comunicacao/api/comunicacao-service";

/**
 * GET /api/admin/comunicacao/auditoria — trilha de auditoria de comunicação (J21).
 * Por padrão lista as leituras de chat pelo admin (`admin.chat.read`).
 * Filtros: ?page, ?pageSize, ?action (override do filtro padrão).
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const url = new URL(request.url);
  const data = await listarAuditoriaAdmin({
    page: Number(url.searchParams.get("page") ?? 1) || 1,
    pageSize: Number(url.searchParams.get("pageSize") ?? 20) || 20,
    action: url.searchParams.get("action") ?? "admin.chat.read",
  });

  const r = NextResponse.json(data);
  setNoCacheHeaders(r);
  return r;
}
