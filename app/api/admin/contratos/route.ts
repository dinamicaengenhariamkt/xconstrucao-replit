import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { isAdminLike } from "@features/auth/api/auth-utils";
import { listarAceites } from "@features/admin/contratos/api/contratos-service";
import { CONTRATO_DOCUMENTOS } from "@features/admin/contratos/constants";
import type { ContratoDocumento } from "@features/admin/contratos/types";

/**
 * GET /api/admin/contratos  (J60)
 * Lista aceites registrados (fonte user_consents), filtrável por `documento` e `q`.
 * Guard admin no padrão da auditoria (token + isAdminLike).
 */
export async function GET(request: NextRequest) {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (!payload?.sub) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  if (!isAdminLike(payload.role)) return NextResponse.json({ message: "Acesso negado" }, { status: 403 });

  const params = new URL(request.url).searchParams;
  const documentoParam = params.get("documento");
  const documento =
    documentoParam && (CONTRATO_DOCUMENTOS as string[]).includes(documentoParam)
      ? (documentoParam as ContratoDocumento)
      : undefined;
  const q = params.get("q")?.trim() || undefined;

  const aceites = await listarAceites({ documento, q });
  return NextResponse.json(aceites);
}
