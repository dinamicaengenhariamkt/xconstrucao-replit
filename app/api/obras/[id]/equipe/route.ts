import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraEquipe } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

const createSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  papel: z.string().trim().max(120).optional().default(""),
  tipo: z.enum(["contratante", "engenheiro", "mestre", "equipe"]).optional(),
  cor: z.string().trim().max(40).optional(),
  telefone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  registro: z.string().trim().max(80).nullable().optional(),
  membros: z.string().trim().max(240).nullable().optional(),
  ativo: z.boolean().optional(),
  permissao: z.enum(["visualizar", "editar", "admin"]).nullable().optional(),
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
    .select()
    .from(obraEquipe)
    .where(eq(obraEquipe.obraId, id))
    .orderBy(asc(obraEquipe.createdAt));
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
  const parsed = createSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  const data = parsed.data;
  const [created] = await db
    .insert(obraEquipe)
    .values({
      obraId: id,
      nome: data.nome,
      papel: data.papel ?? "",
      tipo: data.tipo ?? "equipe",
      cor: data.cor ?? "bg-primary",
      telefone: data.telefone ?? null,
      email: data.email ?? null,
      registro: data.registro ?? null,
      membros: data.membros ?? null,
      ativo: data.ativo ?? true,
      permissao: data.permissao ?? null,
    })
    .returning();
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.equipe.create",
    payload: { obraId: id, membroId: created.id, nome: created.nome },
    request,
  });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
