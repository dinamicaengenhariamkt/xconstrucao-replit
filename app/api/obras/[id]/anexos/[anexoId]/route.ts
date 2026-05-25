import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, obras, obraAnexos, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { deleteObject } from "@shared/lib/storage";

/**
 * DELETE /api/obras/[id]/anexos/[anexoId]
 *  Remove o vínculo + soft-delete do user_files + best-effort delete no R2.
 */
export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; anexoId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id: obraId, anexoId } = await ctx.params;

  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Ownership check (admin OU contratante dono)
  let allowed = isAdminLike(guard.user.role);
  if (!allowed && guard.user.role === "contratante") {
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
    allowed = !!cli && obra.clienteId === cli.id;
  }
  if (!allowed) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const [anexo] = await db
    .select({ id: obraAnexos.id, fileId: obraAnexos.fileId, bucketKey: userFiles.bucketKey })
    .from(obraAnexos)
    .innerJoin(userFiles, eq(userFiles.id, obraAnexos.fileId))
    .where(and(eq(obraAnexos.id, anexoId), eq(obraAnexos.obraId, obraId)));
  if (!anexo) {
    const r = NextResponse.json({ message: "Anexo não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  await db.delete(obraAnexos).where(eq(obraAnexos.id, anexoId));
  await db.update(userFiles).set({ deletedAt: new Date() }).where(eq(userFiles.id, anexo.fileId));

  try {
    await deleteObject(anexo.bucketKey);
  } catch {
    // best-effort: arquivo já pode ter sido removido no R2 — DB é fonte de verdade.
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.anexo.delete",
    targetUserId: null,
    payload: { obraId, anexoId, fileId: anexo.fileId },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
