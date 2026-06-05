// Guarda compartilhada das rotas admin: 401 se não autenticado, 403 se não-admin.
// Espelha o bloco já usado em app/api/admin/clientes/[id]/aprovacao/route.ts.
import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { isAdminLike } from "@features/auth/api/auth-utils";

export interface AdminGuardOk {
  ok: true;
  userId: string;
  role: string;
}
export interface AdminGuardFail {
  ok: false;
  response: NextResponse;
}

export function requireAdmin(request: NextRequest): AdminGuardOk | AdminGuardFail {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) {
    return { ok: false, response: NextResponse.json({ message: "Não autenticado" }, { status: 401 }) };
  }
  if (!isAdminLike(payload.role)) {
    return { ok: false, response: NextResponse.json({ message: "Acesso negado" }, { status: 403 }) };
  }
  return { ok: true, userId: payload.sub, role: payload.role };
}
