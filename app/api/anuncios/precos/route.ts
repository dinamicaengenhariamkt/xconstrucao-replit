import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { tabelaPrecos } from "@features/anuncios/self-service/precificacao";

/**
 * GET /api/anuncios/precos — tabela de preços (protótipo) por zona, p/ o checkout.
 * Requer autenticação (só quem pode anunciar consulta). Valores são simulação até a J31.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const r = NextResponse.json({ precos: tabelaPrecos(), simulacao: true });
  setNoCacheHeaders(r);
  return r;
}
