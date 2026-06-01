import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { registrarEvento } from "@features/anuncios/anuncios-service";

const bodySchema = z.object({ tipo: z.enum(["impressao", "clique"]) });

/**
 * POST /api/anuncios/[id]/eventos — tracking de impressão/clique (público).
 *
 * LGPD: o userId só é gravado se o visitante estiver logado (token válido);
 * visitante anônimo grava userId=null. Rate-limit por IP para conter flood.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const ip = getClientIp(request);
  if (isRateLimited(`anuncios.evento:ip:${ip}`, 120, 60 * 1000)) {
    return NextResponse.json({ error: "RATE_LIMITED" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ message: "tipo inválido (impressao|clique)." }, { status: 400 });
  }

  // userId opcional — só se houver token válido (LGPD: anônimo = null).
  let userId: string | null = null;
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;
  if (payload?.sub) userId = payload.sub;

  const ok = await registrarEvento({ anuncioId: id, tipo: parsed.data.tipo, userId });
  if (!ok) {
    return NextResponse.json({ error: "ANUNCIO_NOT_FOUND" }, { status: 404 });
  }
  return NextResponse.json({ received: true });
}
