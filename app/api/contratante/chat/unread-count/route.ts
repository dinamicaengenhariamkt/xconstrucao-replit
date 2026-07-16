import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { contarNaoLidasTotais } from "@features/chat/service";

/**
 * GET /api/contratante/chat/unread-count
 *
 * Total agregado de mensagens não-lidas do usuário em todas as suas threads.
 * Fonte de verdade do badge global na sidebar (J41 Item 8). O guard é o mesmo
 * das demais rotas de chat; a contagem é por participação na thread, então
 * serve a qualquer papel — a rota é separada por persona apenas por convenção.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const total = await contarNaoLidasTotais(guard.user.id);

  const r = NextResponse.json({ total });
  setNoCacheHeaders(r);
  return r;
}
