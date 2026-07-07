import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getPedido } from "@features/anuncios/self-service/pedido-service";

/** GET /api/anuncios/pedidos/[id] — detalhe/status do pedido do próprio usuário. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await params;
  const pedido = await getPedido(id, guard.user.id);
  if (!pedido) {
    const r = NextResponse.json({ message: "Pedido não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json({ pedido });
  setNoCacheHeaders(r);
  return r;
}
