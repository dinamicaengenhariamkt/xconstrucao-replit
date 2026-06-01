import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getDisputa, listarMensagens } from "@features/disputas/disputas-service";

/** GET /api/admin/disputas/[id] — detalhe + mensagens (inclui notas internas). */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const { id } = await ctx.params;
  const disputa = await getDisputa(id);
  if (!disputa) {
    const r = NextResponse.json({ message: "Disputa não encontrada." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const mensagens = await listarMensagens(id, { incluirInternas: true });
  const r = NextResponse.json({ disputa, mensagens });
  setNoCacheHeaders(r);
  return r;
}
