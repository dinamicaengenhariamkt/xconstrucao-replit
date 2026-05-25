import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { marcarTodasComoLidas } from "@features/notificacoes/service";

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const updated = await marcarTodasComoLidas(guard.user.id);
  const r = NextResponse.json({ ok: true, updated });
  setNoCacheHeaders(r);
  return r;
}
