import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { adicionarMensagem, getDisputa, isParteDaDisputa } from "@features/disputas/disputas-service";

const bodySchema = z.object({
  texto: z.string().trim().min(1).max(2000),
  anexoFileId: z.string().optional().nullable(),
});

/** POST /api/disputas/[id]/mensagens — parte comenta/anexa evidência. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;

  if (isRateLimited(`disputas.mensagem:user:${guard.user.id}`, 60, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const disputa = await getDisputa(id);
  if (!disputa) {
    const r = NextResponse.json({ message: "Disputa não encontrada." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!(await isParteDaDisputa(id, guard.user.id))) {
    const r = NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  if (disputa.status === "resolvida" || disputa.status === "cancelada") {
    const r = NextResponse.json({ message: "Disputa encerrada — não aceita novas mensagens." }, { status: 409 });
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
    anexoFileId: parsed.data.anexoFileId ?? null,
    interna: false,
  });
  const r = NextResponse.json(msg, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
