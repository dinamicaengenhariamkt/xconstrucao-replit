import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { marcarThreadComoLida, podeAcessarThread } from "@features/chat/service";

export async function POST(request: NextRequest, ctx: { params: Promise<{ conversationId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { conversationId } = await ctx.params;
  const thread = await podeAcessarThread(guard.user.id, conversationId);
  if (!thread) {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const marcadas = await marcarThreadComoLida(guard.user.id, conversationId);
  const r = NextResponse.json({ marcadas });
  setNoCacheHeaders(r);
  return r;
}
