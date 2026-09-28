import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiroDocumentos, empreiteiroPortfolio, obraAnexos, obraFotos, obras, userFiles, users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { deleteObject } from "@shared/lib/storage";
import { canWriteObraContent, findObraAccess } from "@features/obras/api/access";

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const [file] = await db.select().from(userFiles).where(eq(userFiles.id, id));
  if (!file || file.deletedAt) {
    const r = NextResponse.json({ message: "Arquivo não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (file.ownerUserId !== guard.user.id && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // Arquivos pessoais que já foram vinculados a conteúdo de obra não podem ser
  // removidos por um membro somente-leitura apenas por serem seus uploads.
  const [anexos, fotos, capas] = await Promise.all([
    db.select({ obraId: obraAnexos.obraId }).from(obraAnexos).where(eq(obraAnexos.fileId, id)),
    db.select({ obraId: obraFotos.obraId }).from(obraFotos).where(eq(obraFotos.fileId, id)),
    db.select({ obraId: obras.id }).from(obras).where(eq(obras.fotoCapaFileId, id)),
  ]);
  const linkedObraIds = [...new Set([...anexos, ...fotos, ...capas].map((row) => row.obraId))];
  for (const obraId of linkedObraIds) {
    const access = await findObraAccess(obraId, { id: guard.user.id, role: guard.user.role });
    if (!access || !canWriteObraContent(access)) {
      const r = NextResponse.json({ message: "Sem permissão para remover arquivo desta obra." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  // Limpa denormalizações.
  if (file.kind === "avatar") {
    await db
      .update(users)
      .set({ avatarUrl: null, avatarFileId: null })
      .where(eq(users.id, file.ownerUserId));
  } else if (file.kind === "portfolio_imagem" || file.kind === "portfolio_doc") {
    await db.delete(empreiteiroPortfolio).where(eq(empreiteiroPortfolio.fileId, file.id));
  } else if (file.kind === "empreiteiro_documento") {
    await db.delete(empreiteiroDocumentos).where(eq(empreiteiroDocumentos.fileId, file.id));
  }

  await deleteObject(file.bucketKey).catch((err) => {
    console.error("[uploads.delete] r2:", err);
  });
  await db.update(userFiles).set({ deletedAt: new Date() }).where(eq(userFiles.id, id));

  if (file.kind === "empreiteiro_documento") {
    await recordAudit({
      actorId: guard.user.id,
      action: "uploads.delete.documento",
      payload: { fileId: file.id, key: file.bucketKey },
      request,
    });
  }

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
