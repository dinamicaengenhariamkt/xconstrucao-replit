import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  auditLogs,
  clientes,
  empreiteiras,
  obras,
  obraAnexos,
  userFiles,
} from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { createSignedReadUrl, publicUrlForKey } from "@shared/lib/storage";
import { desc, sql } from "drizzle-orm";

/**
 * GET /api/admin/obras/[id]
 *  Devolve obra + dados do cliente/empreiteira + anexos + últimos audit_logs (action ilike 'obras.%').
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await ctx.params;
  const [row] = await db
    .select({
      obra: obras,
      cliente: clientes,
      empreiteira: empreiteiras,
    })
    .from(obras)
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(eq(obras.id, id));

  if (!row) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const anexosRows = await db
    .select({
      id: obraAnexos.id,
      tipo: obraAnexos.tipo,
      observacao: obraAnexos.observacao,
      createdAt: obraAnexos.createdAt,
      bucketKey: userFiles.bucketKey,
      originalName: userFiles.originalName,
      mime: userFiles.mime,
      sizeBytes: userFiles.sizeBytes,
      visibility: userFiles.visibility,
      publicUrl: userFiles.publicUrl,
    })
    .from(obraAnexos)
    .innerJoin(userFiles, eq(userFiles.id, obraAnexos.fileId))
    .where(and(eq(obraAnexos.obraId, id), isNull(userFiles.deletedAt)));

  const anexos = await Promise.all(
    anexosRows.map(async (a) => ({
      id: a.id,
      tipo: a.tipo,
      observacao: a.observacao,
      createdAt: a.createdAt,
      originalName: a.originalName,
      mime: a.mime,
      sizeBytes: a.sizeBytes,
      url: a.visibility === "public"
        ? (a.publicUrl ?? publicUrlForKey(a.bucketKey))
        : await createSignedReadUrl({ key: a.bucketKey, filename: a.originalName }).catch(() => null),
    })),
  );

  // Histórico: últimos 20 audit logs de obras.* cujo payload->>obraId = id.
  const history = await db
    .select()
    .from(auditLogs)
    .where(sql`${auditLogs.action} like 'obras.%' and (${auditLogs.payload}->>'obraId') = ${id}`)
    .orderBy(desc(auditLogs.createdAt))
    .limit(20);

  const r = NextResponse.json({
    ...row.obra,
    cliente: row.cliente,
    empreiteira: row.empreiteira,
    anexos,
    history,
  });
  setNoCacheHeaders(r);
  return r;
}
