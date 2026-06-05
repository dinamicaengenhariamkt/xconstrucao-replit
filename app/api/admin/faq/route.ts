import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { isAdminLike } from "@features/auth/api/auth-utils";
import { listarFaqAdmin } from "@features/admin/faq/api/faq-service";

export async function GET(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (!isAdminLike(payload.role)) return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const items = await listarFaqAdmin();
  return NextResponse.json(items);
}
