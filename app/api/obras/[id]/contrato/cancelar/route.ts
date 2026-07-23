import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, obras } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { cancelarContrato } from "@features/contratos/contrato-service";

/**
 * POST /api/obras/[id]/contrato/cancelar  (J58)
 * O CONTRATANTE (ou admin) desfaz o aceite enquanto o contrato não foi totalmente
 * assinado: reabre a obra e as candidaturas. O empreiteiro NÃO cancela.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id: obraId } = await ctx.params;

  const [obra] = await db.select({ clienteId: obras.clienteId }).from(obras).where(eq(obras.id, obraId));
  if (!obra) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Só o contratante dono ou admin.
  let autorizado = isAdminLike(guard.user.role);
  if (!autorizado && obra.clienteId) {
    const [cli] = await db.select({ userId: clientes.userId }).from(clientes).where(eq(clientes.id, obra.clienteId));
    autorizado = cli?.userId === guard.user.id;
  }
  if (!autorizado) {
    const r = NextResponse.json({ error: "FORBIDDEN", message: "Apenas o contratante cancela o contrato." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const res = await cancelarContrato({ obraId });
  if (!res.ok) {
    const status = res.code === "JA_ASSINADO" ? 409 : res.code === "SEM_CONTRATO" ? 409 : 404;
    const r = NextResponse.json({ error: res.code }, { status });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({ actorId: guard.user.id, action: "contrato.cancelar", payload: { obraId }, request });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
