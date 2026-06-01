import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getDisputa, isParteDaDisputa, listarMensagens } from "@features/disputas/disputas-service";

/** GET /api/disputas/[id] — detalhe + mensagens públicas, restrito às partes. */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;

  const disputa = await getDisputa(id);
  if (!disputa) {
    const r = NextResponse.json({ message: "Disputa não encontrada." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const admin = isAdminLike(guard.user.role);
  if (!admin && !(await isParteDaDisputa(id, guard.user.id))) {
    const r = NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // Partes não veem notas internas; admin vê tudo.
  const mensagens = await listarMensagens(id, { incluirInternas: admin });
  const r = NextResponse.json({ disputa, mensagens });
  setNoCacheHeaders(r);
  return r;
}
