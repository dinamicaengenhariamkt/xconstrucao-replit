import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiras, obras } from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { montarContrato } from "@features/contratos/contrato-service";
import { findObraAccess } from "@features/obras/api/access";

/**
 * GET /api/obras/[id]/contrato  (J58)
 * Contrato montado (partes + markdown mesclado + estado + quem já assinou).
 * Acesso: contratante dono, empreiteiro vinculado, ou admin (observa).
 * Devolve também `podeAssinar` (papel do requester quando é a vez dele).
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id: obraId } = await ctx.params;

  const [obra] = await db
    .select()
    .from(obras)
    .where(eq(obras.id, obraId));
  if (!obra) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Leitura de contrato respeita o mesmo escopo de obra, inclusive os grants
  // por obra da equipe xgestão. Não liberar pela mera associação à empresa.
  const access = await findObraAccess(obraId, guard.user);
  if (!access) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const admin = isAdminLike(guard.user.role);
  let papel: "contratante" | "empreiteiro" | null =
    access.role === "contratante" ? "contratante" : null;
  if (access.role === "empreiteiro" && obra.empreiteiraId) {
    const [empresa] = await db
      .select({ userId: empreiteiras.userId })
      .from(empreiteiras)
      .where(eq(empreiteiras.id, obra.empreiteiraId));
    if (empresa?.userId === guard.user.id) papel = "empreiteiro";
  }

  const contrato = await montarContrato(obraId);
  if (!contrato) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const vezEsperada =
    contrato.contratoStatus === "pendente_contratante"
      ? "contratante"
      : contrato.contratoStatus === "pendente_empreiteiro"
        ? "empreiteiro"
        : null;
  const podeAssinar = papel != null && papel === vezEsperada;

  const r = NextResponse.json({ ...contrato, papel: admin ? "admin" : papel, podeAssinar });
  setNoCacheHeaders(r);
  return r;
}
