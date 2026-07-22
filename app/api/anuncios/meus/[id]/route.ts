import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { gerirAnuncioSchema } from "@features/anuncios/self-service/schemas";
import { anuncioPertenceAoUsuario, gerirMeuAnuncio } from "@features/anuncios/self-service/pedido-service";

/** PATCH /api/anuncios/meus/[id] — anunciante pausa/reativa o PRÓPRIO anúncio. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await params;

  // Anti-IDOR: só o dono (via anunciantes.userId) gerencia.
  const dono = await anuncioPertenceAoUsuario(id, guard.user.id);
  if (!dono) {
    const r = NextResponse.json({ message: "Anúncio não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = gerirAnuncioSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Ação inválida", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const ok = await gerirMeuAnuncio(id, guard.user.id, parsed.data.acao);
  // J31 — anúncio de origem PAGA não pode ser pausado/reativado por ora.
  if (ok === "pago") {
    const r = NextResponse.json(
      { message: "Anúncios pagos rodam do início ao fim e não podem ser pausados por enquanto.", code: "ANUNCIO_PAGO" },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (!ok) {
    const r = NextResponse.json({ message: "Não foi possível atualizar o anúncio" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({
    actorId: guard.user.id,
    action: "anuncios.meu.gerir",
    payload: { anuncioId: id, acao: parsed.data.acao },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
