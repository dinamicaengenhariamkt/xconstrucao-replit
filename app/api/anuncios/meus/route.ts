import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarAnunciosDoUsuario } from "@features/anuncios/self-service/pedido-service";

/** GET /api/anuncios/meus — anúncios materializados do usuário (gestão). */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const anuncios = await listarAnunciosDoUsuario(guard.user.id);
  const r = NextResponse.json({ anuncios });
  setNoCacheHeaders(r);
  return r;
}
