import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import { empreiteiroDocumentos, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { createSignedReadUrl } from "@shared/lib/storage";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ message: "Acesso negado" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const rows = await db
    .select({
      id: empreiteiroDocumentos.id,
      fileId: empreiteiroDocumentos.fileId,
      tipo: empreiteiroDocumentos.tipo,
      status: empreiteiroDocumentos.status,
      observacao: empreiteiroDocumentos.observacao,
      createdAt: empreiteiroDocumentos.createdAt,
      originalName: userFiles.originalName,
      mime: userFiles.mime,
      sizeBytes: userFiles.sizeBytes,
      bucketKey: userFiles.bucketKey,
    })
    .from(empreiteiroDocumentos)
    .innerJoin(userFiles, eq(userFiles.id, empreiteiroDocumentos.fileId))
    .where(and(eq(empreiteiroDocumentos.empreiteiroUserId, guard.user.id), isNull(userFiles.deletedAt)))
    .orderBy(desc(empreiteiroDocumentos.createdAt));

  const list = await Promise.all(
    rows.map(async (row) => ({
      id: row.id,
      fileId: row.fileId,
      tipo: row.tipo,
      status: row.status,
      observacao: row.observacao,
      createdAt: row.createdAt,
      originalName: row.originalName,
      mime: row.mime,
      sizeBytes: row.sizeBytes,
      signedUrl: await createSignedReadUrl({ key: row.bucketKey, filename: row.originalName }),
    })),
  );

  const r = NextResponse.json({ items: list });
  setNoCacheHeaders(r);
  return r;
}
