import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { adicionarMensagem, getDisputa } from "@features/disputas/disputas-service";

const bodySchema = z.object({
  texto: z.string().trim().min(1).max(2000),
  interna: z.boolean().optional(),
});

/** POST /api/admin/disputas/[id]/mensagens — admin comenta (pode ser nota interna). */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Texto inválido." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const msg = await adicionarMensagem({
    disputaId: id,
    autorUserId: guard.user.id,
    texto: parsed.data.texto,
    interna: parsed.data.interna ?? false,
  });
  const r = NextResponse.json(msg, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
