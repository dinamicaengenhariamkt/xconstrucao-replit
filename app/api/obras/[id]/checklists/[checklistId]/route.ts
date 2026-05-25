import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraChecklistItens, obraChecklists } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

const itemPatchSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(1).max(240),
  concluida: z.boolean().optional(),
});

const patchSchema = z.object({
  nome: z.string().trim().min(2).max(160).optional(),
  tipo: z.enum(["seguranca", "diario", "etapa"]).optional(),
  descricao: z.string().trim().max(500).optional(),
  status: z.enum(["pendente", "em_andamento", "completo"]).optional(),
  completadoEm: z.string().max(40).nullable().optional(),
  assinadoPor: z.string().max(160).nullable().optional(),
  assinadoEm: z.string().max(40).nullable().optional(),
  registroProfissional: z.string().max(80).nullable().optional(),
  itens: z.array(itemPatchSchema).max(200).optional(),
  toggleItemId: z.string().optional(),
  markAllItens: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; checklistId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, checklistId } = await ctx.params;
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
    .from(obraChecklists)
    .where(and(eq(obraChecklists.id, checklistId), eq(obraChecklists.obraId, id)));
  if (!existing) {
    const r = NextResponse.json({ message: "Checklist não encontrado" }, { status: 404 });
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

  // Toggle de item individual (mutação otimista do cliente)
  if (data.toggleItemId) {
    const [item] = await db
      .select()
      .from(obraChecklistItens)
      .where(
        and(eq(obraChecklistItens.id, data.toggleItemId), eq(obraChecklistItens.checklistId, checklistId)),
      );
    if (item) {
      await db
        .update(obraChecklistItens)
        .set({ concluida: !item.concluida })
        .where(eq(obraChecklistItens.id, item.id));
    }
  }

  // Marcar todos como concluídos (finalizar / assinar)
  if (data.markAllItens) {
    await db
      .update(obraChecklistItens)
      .set({ concluida: true })
      .where(eq(obraChecklistItens.checklistId, checklistId));
  }

  // Substituição da lista de itens (edição)
  if (data.itens) {
    await db.delete(obraChecklistItens).where(eq(obraChecklistItens.checklistId, checklistId));
    if (data.itens.length > 0) {
      await db.insert(obraChecklistItens).values(
        data.itens.map((it, idx) => ({
          checklistId,
          titulo: it.titulo,
          concluida: it.concluida ?? false,
          ordem: idx,
        })),
      );
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["nome", "tipo", "descricao", "status", "completadoEm", "assinadoPor", "assinadoEm", "registroProfissional"] as const) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }
  let updated = existing;
  if (Object.keys(updateData).length > 1) {
    const [u] = await db
      .update(obraChecklists)
      .set(updateData)
      .where(eq(obraChecklists.id, checklistId))
      .returning();
    updated = u;
  }

  const itens = await db
    .select()
    .from(obraChecklistItens)
    .where(eq(obraChecklistItens.checklistId, checklistId))
    .orderBy(asc(obraChecklistItens.ordem), asc(obraChecklistItens.createdAt));

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.checklist.update",
    payload: { obraId: id, checklistId, changes: Object.keys(data) },
    request,
  });
  const r = NextResponse.json({ ...updated, itens });
  setNoCacheHeaders(r);
  return r;
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; checklistId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, checklistId } = await ctx.params;
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
  await db
    .delete(obraChecklists)
    .where(and(eq(obraChecklists.id, checklistId), eq(obraChecklists.obraId, id)));
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.checklist.delete",
    payload: { obraId: id, checklistId },
    request,
  });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
