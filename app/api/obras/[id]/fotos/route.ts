import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraFotos, userFiles, users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";
import { publicUrlForKey } from "@shared/lib/storage";

const createSchema = z.object({
  fileId: z.string().uuid(),
  fase: z.enum(["antes", "durante", "agora"]).nullable().optional(),
  tag: z.string().trim().max(40).nullable().optional(),
  enviadaAoContratante: z.boolean().optional(),
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
      id: obraFotos.id,
      fase: obraFotos.fase,
      tag: obraFotos.tag,
      enviadaAoContratante: obraFotos.enviadaAoContratante,
      autorId: obraFotos.autorId,
      autorNome: users.name,
      autorRole: users.role,
      createdAt: obraFotos.createdAt,
      fileId: obraFotos.fileId,
      bucketKey: userFiles.bucketKey,
      publicUrl: userFiles.publicUrl,
      visibility: userFiles.visibility,
    })
    .from(obraFotos)
    .innerJoin(userFiles, and(eq(userFiles.id, obraFotos.fileId), isNull(userFiles.deletedAt)))
    .innerJoin(users, eq(users.id, obraFotos.autorId))
    .where(eq(obraFotos.obraId, id))
    .orderBy(desc(obraFotos.createdAt));

  const out = rows.map((r) => ({
    id: r.id,
    url: r.visibility === "public" ? (r.publicUrl ?? publicUrlForKey(r.bucketKey)) : "",
    fase: r.fase,
    tag: r.tag,
    enviadaAoContratante: r.enviadaAoContratante,
    autorId: r.autorId,
    autorNome: r.autorNome,
    autorRole: r.autorRole,
    createdAt: r.createdAt,
  }));
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
  const [f] = await db.select({ ownerUserId: userFiles.ownerUserId, kind: userFiles.kind })
    .from(userFiles)
    .where(and(eq(userFiles.id, parsed.data.fileId), isNull(userFiles.deletedAt)));
  if (!f || f.ownerUserId !== guard.user.id || f.kind !== "obra_foto") {
    const r = NextResponse.json({ message: "Arquivo inválido." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const [created] = await db.insert(obraFotos).values({
    obraId: id,
    autorId: guard.user.id,
    fileId: parsed.data.fileId,
    fase: parsed.data.fase ?? null,
    tag: parsed.data.tag ?? null,
    enviadaAoContratante: parsed.data.enviadaAoContratante ?? true,
  }).returning();
  await recordAudit({ actorId: guard.user.id, action: "obras.foto.create", payload: { obraId: id, fotoId: created.id }, request });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
