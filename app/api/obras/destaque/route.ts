import { NextResponse } from "next/server";
import { listarDestaquesPublicos } from "@features/admin/obras-destaque/api/obras-destaque-service";

/**
 * GET /api/obras/destaque — obras em destaque para a home (público, sem auth).
 * Whitelist de campos seguros (sem valor/contratante/empreiteira/endereço).
 * Cacheável; pausas/mudanças refletem em ≤60s.
 */
export async function GET() {
  const rows = await listarDestaquesPublicos();
  const r = NextResponse.json({ rows });
  r.headers.set("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=120");
  return r;
}
