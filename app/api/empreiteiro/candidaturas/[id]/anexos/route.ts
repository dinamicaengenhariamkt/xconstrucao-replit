import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas, candidaturaAnexos, userFiles } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { createSignedReadUrl } from "@shared/lib/storage";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";

const bodySchema = z.object({
  fileId: z.string().min(8).max(64),
});

/** GET — lista anexos da candidatura (apenas o empreiteiro dono ou admin). */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;

  const [cand] = await db
    .select({ id: candidaturas.id, empreiteiroId: candidaturas.empreiteiroId })
    .from(candidaturas)
    .where(eq(candidaturas.id, id));
  if (!cand) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Empreiteiro dono ou admin/superadmin (contratante usa a rota dele)
  if (!isAdminLike(guard.user.role) && cand.empreiteiroId !== guard.user.id) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const rows = await db
    .select({
      id: candidaturaAnexos.id,
      fileId: candidaturaAnexos.fileId,
      createdAt: candidaturaAnexos.createdAt,
      bucketKey: userFiles.bucketKey,
      originalName: userFiles.originalName,
      mime: userFiles.mime,
      sizeBytes: userFiles.sizeBytes,
    })
    .from(candidaturaAnexos)
    .innerJoin(userFiles, eq(userFiles.id, candidaturaAnexos.fileId))
    .where(and(eq(candidaturaAnexos.candidaturaId, id), isNull(userFiles.deletedAt)))
    .orderBy(desc(candidaturaAnexos.createdAt));

  const out = await Promise.all(
    rows.map(async (a) => ({
      id: a.id,
      fileId: a.fileId,
      originalName: a.originalName,
      mime: a.mime,
      sizeBytes: a.sizeBytes,
      createdAt: a.createdAt,
      url: await createSignedReadUrl({ key: a.bucketKey, filename: a.originalName }).catch(() => null),
    })),
  );

  const r = NextResponse.json(out);
  setNoCacheHeaders(r);
  return r;
}

/**
 * POST — vincula um user_files (kind=candidatura_anexo, já uploaded) à candidatura.
 * - Apenas o empreiteiro dono da candidatura pode anexar.
 * - Permitido enquanto a candidatura ainda está `pendente` (após aceitar/rejeitar,
 *   trava: ninguém mais altera anexos).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await ctx.params;

  const ip = getClientIp(request);
  if (isRateLimited(`candidaturas.anexo.create:user:${guard.user.id}`, 30, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitos anexos enviados em pouco tempo. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`candidaturas.anexo.create:ip:${ip}`, 60, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const [cand] = await db
    .select({ id: candidaturas.id, status: candidaturas.status, empreiteiroId: candidaturas.empreiteiroId })
    .from(candidaturas)
    .where(and(eq(candidaturas.id, id), eq(candidaturas.empreiteiroId, guard.user.id)));
  if (!cand) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (cand.status !== "pendente") {
    const r = NextResponse.json(
      { error: "INVALID_STATE", message: "Esta proposta não está mais pendente." },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const [file] = await db.select().from(userFiles).where(eq(userFiles.id, parsed.data.fileId));
  if (!file || file.deletedAt) {
    const r = NextResponse.json({ message: "Arquivo não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (file.kind !== "candidatura_anexo") {
    const r = NextResponse.json({ message: "Arquivo não é do tipo candidatura_anexo" }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  if (file.ownerUserId !== guard.user.id) {
    const r = NextResponse.json({ message: "Arquivo não pertence ao usuário" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const [created] = await db
    .insert(candidaturaAnexos)
    .values({ candidaturaId: id, fileId: parsed.data.fileId, createdBy: guard.user.id })
    .returning();

  await recordAudit({
    actorId: guard.user.id,
    action: "candidaturas.anexo.create",
    targetUserId: null,
    payload: { candidaturaId: id, anexoId: created.id, fileId: parsed.data.fileId },
    request,
  });

  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
