import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraEquipe } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

const patchSchema = z.object({
  nome: z.string().trim().min(1).max(120).optional(),
  papel: z.string().trim().max(120).optional(),
  tipo: z.enum(["contratante", "engenheiro", "mestre", "equipe"]).optional(),
  cor: z.string().trim().max(40).optional(),
  telefone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  registro: z.string().trim().max(80).nullable().optional(),
  membros: z.string().trim().max(240).nullable().optional(),
  ativo: z.boolean().optional(),
  permissao: z.enum(["visualizar", "editar", "admin"]).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; membroId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, membroId } = await ctx.params;
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
  const [existing] = await db
    .select()
    .from(obraEquipe)
    .where(and(eq(obraEquipe.id, membroId), eq(obraEquipe.obraId, id)));
  if (!existing) {
    const r = NextResponse.json({ message: "Membro não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  const data = parsed.data;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of Object.keys(data) as (keyof typeof data)[]) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }
  const [updated] = await db
    .update(obraEquipe)
    .set(updateData)
    .where(eq(obraEquipe.id, membroId))
    .returning();
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.equipe.update",
    payload: { obraId: id, membroId, changes: Object.keys(data) },
    request,
  });
  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; membroId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, membroId } = await ctx.params;
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
  await db.delete(obraEquipe).where(and(eq(obraEquipe.id, membroId), eq(obraEquipe.obraId, id)));
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.equipe.delete",
    payload: { obraId: id, membroId },
    request,
  });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
