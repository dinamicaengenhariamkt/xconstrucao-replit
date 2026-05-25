import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obraDiario } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders, isAdminLike } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess } from "@features/obras/api/access";

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string; entryId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, entryId } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const [entry] = await db.select().from(obraDiario).where(and(eq(obraDiario.id, entryId), eq(obraDiario.obraId, id)));
  if (!entry) {
    const r = NextResponse.json({ message: "Registro não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  // Autor pode deletar o próprio. Admin/contratante dono também.
  const canDelete = entry.autorId === guard.user.id || isAdminLike(guard.user.role) || access.role === "contratante";
  if (!canDelete) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  await db.delete(obraDiario).where(eq(obraDiario.id, entryId));
  await recordAudit({ actorId: guard.user.id, action: "obras.diario.delete", payload: { obraId: id, diarioId: entryId }, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
