import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { computeHealthMapForObras } from "@features/shared/health/summary-server";

/**
 * GET /api/obras/[id]/health — saúde REAL de UMA obra (J17), com o mesmo
 * scoping de acesso de `/api/obras/[id]`. Usado nos detalhes de obra
 * (contratante/admin) no lugar de `getMockHealth(obra.id)`.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const [obra] = await db.select().from(obras).where(eq(obras.id, id));
  if (!obra) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Scoping de acesso (espelha findObraWithAccess de /api/obras/[id]).
  const role = guard.user.role;
  let allowed = false;
  if (isAdminLike(role)) {
    allowed = true;
  } else if (role === "contratante") {
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
    allowed = !!cli && obra.clienteId === cli.id;
  } else if (role === "empreiteiro") {
    const [emp] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, guard.user.id));
    const publicaDisponivel =
      obra.visibilidade === "publicada" && obra.empreiteiraId === null && obra.statusModeracao === "aprovada";
    allowed = publicaDisponivel || (!!emp && obra.empreiteiraId === emp.id);
  }

  if (!allowed) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const map = await computeHealthMapForObras([id]);
  const r = NextResponse.json(map[id] ?? null);
  setNoCacheHeaders(r);
  return r;
}
