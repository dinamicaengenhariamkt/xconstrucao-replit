import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { obraFotos, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders, isAdminLike } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess } from "@features/obras/api/access";
import { deleteObject } from "@shared/lib/storage";

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string; fotoId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, fotoId } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const [foto] = await db.select().from(obraFotos).where(and(eq(obraFotos.id, fotoId), eq(obraFotos.obraId, id)));
  if (!foto) {
    const r = NextResponse.json({ message: "Foto não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  // Autor, contratante dono ou admin
  const canDelete = foto.autorId === guard.user.id || isAdminLike(guard.user.role) || access.role === "contratante";
  if (!canDelete) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  // Soft-delete do file row + delete da row de foto. Cascade já removeria, mas vamos limpar R2.
  const [file] = await db.select({ bucketKey: userFiles.bucketKey }).from(userFiles).where(eq(userFiles.id, foto.fileId));
  await db.delete(obraFotos).where(eq(obraFotos.id, fotoId));
  if (file) {
    await db.update(userFiles).set({ deletedAt: new Date() }).where(eq(userFiles.id, foto.fileId));
    await deleteObject(file.bucketKey).catch(() => null);
  }
  await recordAudit({ actorId: guard.user.id, action: "obras.foto.delete", payload: { obraId: id, fotoId }, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
