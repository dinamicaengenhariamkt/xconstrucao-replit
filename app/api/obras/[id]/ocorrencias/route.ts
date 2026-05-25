import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraOcorrencias, userFiles, users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";
import { publicUrlForKey } from "@shared/lib/storage";

const createSchema = z.object({
  titulo: z.string().trim().min(3).max(160),
  descricao: z.string().trim().min(3).max(2000),
  gravidade: z.enum(["critico", "medio", "baixo"]).default("medio"),
  fotoFileId: z.string().uuid().nullable().optional(),
});

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const rows = await db
    .select({
      id: obraOcorrencias.id,
      titulo: obraOcorrencias.titulo,
      descricao: obraOcorrencias.descricao,
      gravidade: obraOcorrencias.gravidade,
      status: obraOcorrencias.status,
      autorId: obraOcorrencias.autorId,
      autorNome: users.name,
      fotoFileId: obraOcorrencias.fotoFileId,
      fotoBucketKey: userFiles.bucketKey,
      fotoPublicUrl: userFiles.publicUrl,
      fotoVisibility: userFiles.visibility,
      fotoDeletedAt: userFiles.deletedAt,
      resolvidoPorId: obraOcorrencias.resolvidoPorId,
      resolvidoEm: obraOcorrencias.resolvidoEm,
      createdAt: obraOcorrencias.createdAt,
    })
    .from(obraOcorrencias)
    .innerJoin(users, eq(users.id, obraOcorrencias.autorId))
    .leftJoin(userFiles, eq(userFiles.id, obraOcorrencias.fotoFileId))
    .where(eq(obraOcorrencias.obraId, id))
    .orderBy(desc(obraOcorrencias.createdAt));

  // Nome do resolvedor (batched, sem N+1)
  const resolverIds = Array.from(new Set(rows.map((r) => r.resolvidoPorId).filter(Boolean) as string[]));
  const resolverMap = new Map<string, string>();
  if (resolverIds.length > 0) {
    const resolvers = await db.select({ id: users.id, name: users.name }).from(users).where(inArray(users.id, resolverIds));
    for (const u of resolvers) resolverMap.set(u.id, u.name);
  }

  const out = rows.map((r) => {
    const fotoUrl = r.fotoFileId && r.fotoDeletedAt === null && r.fotoBucketKey
      ? (r.fotoVisibility === "public" ? (r.fotoPublicUrl ?? publicUrlForKey(r.fotoBucketKey)) : null)
      : null;
    return {
      id: r.id,
      titulo: r.titulo,
      descricao: r.descricao,
      gravidade: r.gravidade,
      status: r.status,
      autorId: r.autorId,
      autorNome: r.autorNome,
      fotoUrl,
      resolvidoPorId: r.resolvidoPorId,
      resolvidoPorNome: r.resolvidoPorId ? resolverMap.get(r.resolvidoPorId) ?? null : null,
      resolvidoEm: r.resolvidoEm,
      createdAt: r.createdAt,
    };
  });
  const r = NextResponse.json({ rows: out });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!canWriteObraContent(access)) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  if (parsed.data.fotoFileId) {
    const [f] = await db.select({ ownerUserId: userFiles.ownerUserId, kind: userFiles.kind }).from(userFiles)
      .where(and(eq(userFiles.id, parsed.data.fotoFileId), isNull(userFiles.deletedAt)));
    if (!f || f.ownerUserId !== guard.user.id || f.kind !== "obra_foto") {
      const r = NextResponse.json({ message: "Foto inválida." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
  }
  const [created] = await db.insert(obraOcorrencias).values({
    obraId: id,
    autorId: guard.user.id,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao,
    gravidade: parsed.data.gravidade,
    fotoFileId: parsed.data.fotoFileId ?? null,
  }).returning();
  await recordAudit({ actorId: guard.user.id, action: "obras.ocorrencia.create", payload: { obraId: id, ocorrenciaId: created.id, gravidade: parsed.data.gravidade }, request });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
