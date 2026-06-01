import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";

/**
 * GET /api/admin/caixa/indicadores — indicadores econômicos (IPCA/INCC/SELIC).
 *
 * PENDENTE: não há fonte de dados real no projeto (exigiria integração com API
 * externa, ex: Banco Central / IBGE). Retorna lista vazia até a integração ser
 * decidida. Ver docs/jornadas/09-financeiro-admin.md §13.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json([]);
  setNoCacheHeaders(r);
  return r;
}
