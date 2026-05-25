import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas, candidaturaAnexos, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { deleteObject } from "@shared/lib/storage";

/**
 * DELETE /api/empreiteiro/candidaturas/[id]/anexos/[anexoId]
 *  - Apenas empreiteiro dono enquanto a candidatura está `pendente`.
 *  - Remove vínculo + soft-delete do user_files + best-effort delete no R2.
 */
export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; anexoId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id: candidaturaId, anexoId } = await ctx.params;

  const [cand] = await db
    .select({ id: candidaturas.id, status: candidaturas.status, empreiteiroId: candidaturas.empreiteiroId })
    .from(candidaturas)
    .where(eq(candidaturas.id, candidaturaId));
  if (!cand) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const isOwner = cand.empreiteiroId === guard.user.id && guard.user.role === "empreiteiro";
  if (!isOwner && !isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (isOwner && cand.status !== "pendente") {
    const r = NextResponse.json(
      { error: "INVALID_STATE", message: "Esta proposta não está mais pendente." },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const [anexo] = await db
    .select({ id: candidaturaAnexos.id, fileId: candidaturaAnexos.fileId, bucketKey: userFiles.bucketKey })
    .from(candidaturaAnexos)
    .innerJoin(userFiles, eq(userFiles.id, candidaturaAnexos.fileId))
    .where(and(eq(candidaturaAnexos.id, anexoId), eq(candidaturaAnexos.candidaturaId, candidaturaId)));
  if (!anexo) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  await db.delete(candidaturaAnexos).where(eq(candidaturaAnexos.id, anexoId));
  await db.update(userFiles).set({ deletedAt: new Date() }).where(eq(userFiles.id, anexo.fileId));

  try {
    await deleteObject(anexo.bucketKey);
  } catch {
    /* best-effort */
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "candidaturas.anexo.delete",
    targetUserId: null,
    payload: { candidaturaId, anexoId, fileId: anexo.fileId },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
