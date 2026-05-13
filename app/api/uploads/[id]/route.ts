import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiras, empreiteiroDocumentos, userFiles, users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { deleteObject } from "@shared/lib/storage";

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

  // Limpa denormalizações.
  if (file.kind === "avatar") {
    await db
      .update(users)
      .set({ avatarUrl: null })
      .where(and(eq(users.id, file.ownerUserId), eq(users.avatarUrl, file.publicUrl ?? "")));
  } else if (file.kind === "portfolio_imagem" || file.kind === "portfolio_doc") {
    const [emp] = await db.select().from(empreiteiras).where(eq(empreiteiras.userId, file.ownerUserId));
    if (emp && file.publicUrl) {
      if (file.kind === "portfolio_imagem") {
        const next = (emp.portfolioUrls ?? []).filter((u) => u !== file.publicUrl);
        await db.update(empreiteiras).set({ portfolioUrls: next }).where(eq(empreiteiras.id, emp.id));
      } else {
        // portfolio_doc é armazenado no formato "nome::url" — filtra pela URL no sufixo.
        const next = (emp.portfolioDocs ?? []).filter((entry) => {
          const url = entry.includes("::") ? entry.split("::").slice(1).join("::") : entry;
          return url !== file.publicUrl;
        });
        await db.update(empreiteiras).set({ portfolioDocs: next }).where(eq(empreiteiras.id, emp.id));
      }
    }
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
