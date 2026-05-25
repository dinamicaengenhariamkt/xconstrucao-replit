import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { marcarComoLida } from "@features/notificacoes/service";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const ok = await marcarComoLida(guard.user.id, id);
  if (!ok) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
