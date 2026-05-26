import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { searchMunicipios } from "@shared/lib/ibge-municipios";

/**
 * GET /api/cidades?q=&uf=&limit=
 *
 * Autocomplete de cidades brasileiras (fonte IBGE). Usado pelo input "Cidades"
 * da zona de atuação (Task #95) para evitar duplicatas como "São Paulo"/"Sao Paulo".
 *
 * Auth: qualquer usuário verificado. Cache curto (5 min) no cliente.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").slice(0, 80);
  const ufRaw = url.searchParams.get("uf");
  const uf = ufRaw && /^[A-Za-z]{2}$/.test(ufRaw) ? ufRaw.toUpperCase() : undefined;
  const limitRaw = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.floor(limitRaw))) : 20;

  const list = await searchMunicipios(q, uf, limit);
  const response = NextResponse.json({
    rows: list.map(({ nome, uf }) => ({ nome, uf })),
  });
  response.headers.set("Cache-Control", "private, max-age=300");
  return response;
}
