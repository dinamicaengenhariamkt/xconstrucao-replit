import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiroDocumentos, empreiteiroPortfolio, financeiro, obraAnexos, obraFotos, obras, userFiles, users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { deleteObject } from "@shared/lib/storage";
import {
  canAccessObraFinanceCategory,
  canWriteObraArea,
  findObraAccess,
} from "@features/obras/api/access";

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
  const [anexos, fotos, capas, lancamentos] = await Promise.all([
    db.select({ obraId: obraAnexos.obraId }).from(obraAnexos).where(eq(obraAnexos.fileId, id)),
    db.select({ obraId: obraFotos.obraId }).from(obraFotos).where(eq(obraFotos.fileId, id)),
    db.select({ obraId: obras.id }).from(obras).where(eq(obras.fotoCapaFileId, id)),
    db.select({ obraId: financeiro.obraId, categoria: financeiro.categoria })
      .from(financeiro).where(eq(financeiro.comprovanteFileId, id)),
  ]);
  const linkedResources = [
    ...anexos.map((row) => ({ obraId: row.obraId, area: "equipe" as const })),
    ...fotos.map((row) => ({ obraId: row.obraId, area: "diario" as const })),
    ...capas.map((row) => ({ obraId: row.obraId, area: "diario" as const })),
    ...lancamentos.filter((row) => row.obraId).map((row) => ({
      obraId: row.obraId!,
      area: "financeiro" as const,
      categoria: row.categoria,
    })),
  ];
  const uniqueResources = new Map(linkedResources.map((resource) => [
    `${resource.obraId}:${resource.area}:${"categoria" in resource ? resource.categoria : ""}`,
    resource,
  ]));
  for (const resource of uniqueResources.values()) {
    const { obraId, area } = resource;
    const access = await findObraAccess(obraId, { id: guard.user.id, role: guard.user.role });
    if (!access || !canWriteObraArea(access, area)) {
      const r = NextResponse.json({ message: "Sem permissão para remover arquivo desta obra." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    if ("categoria" in resource && !canAccessObraFinanceCategory(access, resource.categoria)) {
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
