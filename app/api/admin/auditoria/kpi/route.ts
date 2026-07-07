import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { isAdminLike } from "@features/auth/api/auth-utils";
import { obterAuditoriaKpi } from "@features/admin/auditoria/api/auditoria-service";

export async function GET(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (!isAdminLike(payload.role)) return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const kpi = await obterAuditoriaKpi();
  return NextResponse.json(kpi);
}
