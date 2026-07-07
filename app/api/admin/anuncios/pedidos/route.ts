import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarFilaModeracao } from "@features/anuncios/self-service/pedido-service";

/** GET /api/admin/anuncios/pedidos?status= — fila de moderação (default em_analise). */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "em_analise";
  const pedidos = await listarFilaModeracao(status === "todos" ? undefined : status);
  const r = NextResponse.json({ pedidos });
  setNoCacheHeaders(r);
  return r;
}
