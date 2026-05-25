import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraDiario, userFiles, users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { publicUrlForKey } from "@shared/lib/storage";

const createSchema = z.object({
  texto: z.string().trim().min(2).max(2000),
  fotoFileIds: z.array(z.string().uuid()).max(10).optional(),
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
      id: obraDiario.id,
      texto: obraDiario.texto,
      fotoFileIds: obraDiario.fotoFileIds,
      createdAt: obraDiario.createdAt,
      autorId: obraDiario.autorId,
      autorNome: users.name,
      autorRole: users.role,
    })
    .from(obraDiario)
    .innerJoin(users, eq(users.id, obraDiario.autorId))
    .where(eq(obraDiario.obraId, id))
    .orderBy(desc(obraDiario.createdAt));

  // Resolve URLs públicas das fotos
  const allFileIds = Array.from(new Set(rows.flatMap((r) => r.fotoFileIds ?? [])));
  const fileMap = new Map<string, { url: string }>();
  if (allFileIds.length > 0) {
    const files = await db
      .select({ id: userFiles.id, bucketKey: userFiles.bucketKey, publicUrl: userFiles.publicUrl, visibility: userFiles.visibility })
      .from(userFiles)
      .where(and(inArray(userFiles.id, allFileIds), isNull(userFiles.deletedAt)));
    for (const f of files) {
      const url = f.visibility === "public" ? (f.publicUrl ?? publicUrlForKey(f.bucketKey)) : "";
      if (url) fileMap.set(f.id, { url });
    }
  }

  const out = rows.map((r) => ({
    id: r.id,
    texto: r.texto,
    autorId: r.autorId,
    autorNome: r.autorNome,
    autorRole: r.autorRole,
    createdAt: r.createdAt,
    fotos: (r.fotoFileIds ?? []).map((fid) => fileMap.get(fid)?.url).filter(Boolean) as string[],
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
  // Validar ownership dos fileIds (têm que ser do autor)
  const fileIds = parsed.data.fotoFileIds ?? [];
  if (fileIds.length > 0) {
    const files = await db
      .select({ id: userFiles.id, ownerUserId: userFiles.ownerUserId, kind: userFiles.kind })
      .from(userFiles)
      .where(and(inArray(userFiles.id, fileIds), isNull(userFiles.deletedAt)));
    if (files.length !== fileIds.length) {
      const r = NextResponse.json({ message: "Algumas fotos não foram encontradas." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    for (const f of files) {
      if (f.ownerUserId !== guard.user.id || f.kind !== "obra_foto") {
        const r = NextResponse.json({ message: "Foto inválida." }, { status: 403 });
        setNoCacheHeaders(r);
        return r;
      }
    }
  }
  const [created] = await db.insert(obraDiario).values({
    obraId: id,
    autorId: guard.user.id,
    texto: parsed.data.texto,
    fotoFileIds: fileIds,
  }).returning();
  await recordAudit({ actorId: guard.user.id, action: "obras.diario.create", payload: { obraId: id, diarioId: created.id, fotoCount: fileIds.length }, request });
  void registrarAtividade({
    tipo: "diario_postado",
    actorUserId: guard.user.id,
    obraId: id,
    payload: { diarioId: created.id, fotoCount: fileIds.length, preview: parsed.data.texto.slice(0, 140) },
  });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
