import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { moderarPedidoSchema } from "@features/anuncios/self-service/schemas";
import { getPedido, moderarPedido } from "@features/anuncios/self-service/pedido-service";

/** PATCH /api/admin/anuncios/pedidos/[id] — aprovar/recusar (materializa na aprovação). */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = moderarPedidoSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const result = await moderarPedido({
    pedidoId: id,
    acao: parsed.data.acao,
    moderadorId: guard.user.id,
    motivoRecusa: parsed.data.motivoRecusa ?? null,
    valorTotal: parsed.data.valorTotal,
  });

  if (!result) {
    const r = NextResponse.json({ message: "Pedido não encontrado ou não está em análise" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({
    actorId: guard.user.id,
    action: "anuncios.pedido.moderar",
    payload: {
      pedidoId: id,
      acao: parsed.data.acao,
      slotsPublicados: result.slotsPublicados,
      slotsPulados: result.slotsPulados,
    },
    request,
  });

  // Notifica o anunciante (best-effort).
  void import("@features/notificacoes/anuncio-dispatcher")
    .then((m) =>
      parsed.data.acao === "aprovar"
        ? m.notificarPedidoAprovado(id, result.pedido.solicitanteUserId, result.slotsPublicados)
        : m.notificarPedidoRecusado(id, result.pedido.solicitanteUserId, result.pedido.motivoRecusa ?? "—"),
    )
    .catch(() => {});

  const r = NextResponse.json({
    pedido: result.pedido,
    slotsPublicados: result.slotsPublicados,
    slotsPulados: result.slotsPulados,
  });
  setNoCacheHeaders(r);
  return r;
}
