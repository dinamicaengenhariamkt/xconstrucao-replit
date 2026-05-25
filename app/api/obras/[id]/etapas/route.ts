import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraEtapas } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

const createSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  descricao: z.string().trim().max(500).optional().nullable(),
  ordem: z.number().int().min(0).max(999).optional(),
  responsavel: z.string().trim().max(120).optional().nullable(),
  prazo: z.string().datetime().optional().nullable(),
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
  const rows = await db.select().from(obraEtapas).where(eq(obraEtapas.obraId, id)).orderBy(asc(obraEtapas.ordem), asc(obraEtapas.createdAt));
  const r = NextResponse.json({ rows });
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
  // Empreiteiro NÃO cria etapas — só contratante/admin definem escopo.
  if (access.role === "empreiteiro") {
    const r = NextResponse.json({ message: "Apenas o contratante pode criar etapas." }, { status: 403 });
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
  const { nome, descricao, ordem, responsavel, prazo } = parsed.data;
  const [created] = await db.insert(obraEtapas).values({
    obraId: id,
    nome,
    descricao: descricao ?? null,
    ordem: ordem ?? 0,
    responsavel: responsavel ?? null,
    prazo: prazo ? new Date(prazo) : null,
  }).returning();
  await recordAudit({ actorId: guard.user.id, action: "obras.etapa.create", payload: { obraId: id, etapaId: created.id, nome }, request });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
