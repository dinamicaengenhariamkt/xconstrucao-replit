import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras } from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { montarContrato } from "@features/contratos/contrato-service";

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
    .select({ clienteId: obras.clienteId, empreiteiraId: obras.empreiteiraId })
    .from(obras)
    .where(eq(obras.id, obraId));
  if (!obra) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Autorização + descobrir o papel do requester.
  let papel: "contratante" | "empreiteiro" | null = null;
  const admin = isAdminLike(guard.user.role);
  if (!admin) {
    if (obra.clienteId) {
      const [cli] = await db.select({ userId: clientes.userId }).from(clientes).where(eq(clientes.id, obra.clienteId));
      if (cli?.userId === guard.user.id) papel = "contratante";
    }
    if (!papel && obra.empreiteiraId) {
      const [emp] = await db.select({ userId: empreiteiras.userId }).from(empreiteiras).where(eq(empreiteiras.id, obra.empreiteiraId));
      if (emp?.userId === guard.user.id) papel = "empreiteiro";
    }
    if (!papel) {
      // Anti-enumeração: 404 em vez de 403.
      const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      setNoCacheHeaders(r);
      return r;
    }
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
