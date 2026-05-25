import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, obras, obraAnexos, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { createSignedReadUrl, publicUrlForKey } from "@shared/lib/storage";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";

const TIPOS = [
  "projeto_arquitetonico",
  "projeto_estrutural",
  "art_rrt",
  "alvara",
  "foto_local",
  "contrato",
  "outros",
] as const;

const bodySchema = z.object({
  fileId: z.string().min(8).max(64),
  tipo: z.enum(TIPOS),
  observacao: z.string().trim().max(500).optional().nullable(),
});

/** Verifica ownership de uma obra para o usuário autenticado. */
async function assertObraWritable(
  obraId: string,
  user: { id: string; role: string },
): Promise<{ ok: true; obra: typeof obras.$inferSelect } | { ok: false; status: number; message: string }> {
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) return { ok: false, status: 404, message: "Obra não encontrada" };

  if (isAdminLike(user.role)) return { ok: true, obra };
  if (user.role !== "contratante") {
    return { ok: false, status: 403, message: "Sem permissão." };
  }
  const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, user.id));
  if (!cli || obra.clienteId !== cli.id) {
    return { ok: false, status: 404, message: "Obra não encontrada" };
  }
  return { ok: true, obra };
}

/** GET — lista anexos da obra (qualquer um com acesso leitura pode ver). */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id: obraId } = await ctx.params;
  const [obra] = await db.select().from(obras).where(eq(obras.id, obraId));
  if (!obra) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Reaproveita check de leitura: admin + dono + empreiteiro com obra pública visível.
  let allowed = isAdminLike(guard.user.role);
  if (!allowed && guard.user.role === "contratante") {
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
    allowed = !!cli && obra.clienteId === cli.id;
  } else if (!allowed && guard.user.role === "empreiteiro") {
    allowed = obra.visibilidade === "publicada" && obra.empreiteiraId === null;
  }
  if (!allowed) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const rows = await db
    .select({
      id: obraAnexos.id,
      tipo: obraAnexos.tipo,
      observacao: obraAnexos.observacao,
      createdAt: obraAnexos.createdAt,
      fileId: obraAnexos.fileId,
      bucketKey: userFiles.bucketKey,
      originalName: userFiles.originalName,
      mime: userFiles.mime,
      sizeBytes: userFiles.sizeBytes,
      visibility: userFiles.visibility,
      publicUrl: userFiles.publicUrl,
    })
    .from(obraAnexos)
    .innerJoin(userFiles, eq(userFiles.id, obraAnexos.fileId))
    .where(and(eq(obraAnexos.obraId, obraId), isNull(userFiles.deletedAt)))
    .orderBy(desc(obraAnexos.createdAt));

  const out = await Promise.all(
    rows.map(async (a) => ({
      id: a.id,
      tipo: a.tipo,
      observacao: a.observacao,
      createdAt: a.createdAt,
      fileId: a.fileId,
      originalName: a.originalName,
      mime: a.mime,
      sizeBytes: a.sizeBytes,
      url: a.visibility === "public"
        ? (a.publicUrl ?? publicUrlForKey(a.bucketKey))
        : await createSignedReadUrl({ key: a.bucketKey, filename: a.originalName }).catch(() => null),
    })),
  );

  const r = NextResponse.json(out);
  setNoCacheHeaders(r);
  return r;
}

/**
 * POST — vincula um user_files (já uploaded com kind='obra_anexo') a uma obra.
 * Valida:
 *  - ownership da obra (ou admin).
 *  - existência do fileId, kind='obra_anexo', dono = usuário (ou admin).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id: obraId } = await ctx.params;
  const check = await assertObraWritable(obraId, { id: guard.user.id, role: guard.user.role });
  if (!check.ok) {
    const r = NextResponse.json({ message: check.message }, { status: check.status });
    setNoCacheHeaders(r);
    return r;
  }

  // Rate limit: máx 20 anexos por obra por minuto + 60 por usuário por minuto.
  const ip = getClientIp(request);
  if (isRateLimited(`obras.anexo.create:obra:${obraId}`, 20, 60 * 1000)) {
    const r = NextResponse.json(
      { message: "Muitos anexos enviados nesta obra em pouco tempo. Aguarde um minuto e tente novamente." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`obras.anexo.create:user:${guard.user.id}`, 60, 60 * 1000)) {
    const r = NextResponse.json(
      { message: "Muitos anexos enviados em pouco tempo. Aguarde um minuto e tente novamente." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`obras.anexo.create:ip:${ip}`, 120, 60 * 1000)) {
    const r = NextResponse.json(
      { message: "Muitas requisições. Aguarde um minuto e tente novamente." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const [file] = await db.select().from(userFiles).where(eq(userFiles.id, parsed.data.fileId));
  if (!file || file.deletedAt) {
    const r = NextResponse.json({ message: "Arquivo não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (file.kind !== "obra_anexo") {
    const r = NextResponse.json({ message: "Arquivo não é do tipo obra_anexo" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!isAdminLike(guard.user.role) && file.ownerUserId !== guard.user.id) {
    const r = NextResponse.json({ message: "Arquivo não pertence ao usuário" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const [created] = await db
    .insert(obraAnexos)
    .values({
      obraId,
      fileId: parsed.data.fileId,
      tipo: parsed.data.tipo,
      observacao: parsed.data.observacao ?? null,
      createdBy: guard.user.id,
    })
    .returning();

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.anexo.create",
    targetUserId: null,
    payload: { obraId, anexoId: created.id, tipo: parsed.data.tipo, fileId: parsed.data.fileId },
    request,
  });

  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
