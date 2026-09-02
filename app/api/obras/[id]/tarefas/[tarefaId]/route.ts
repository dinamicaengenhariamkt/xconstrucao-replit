import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraEtapas, obraTarefas } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

const patchSchema = z.object({
  titulo: z.string().trim().min(2).max(160).optional(),
  etapa: z.string().trim().max(160).optional(),
  etapaId: z.string().trim().nullable().optional(),
  responsavel: z.string().trim().max(120).optional(),
  prazo: z.string().trim().max(40).optional(),
  status: z.enum(["pendente", "em_andamento", "bloqueado", "concluido"]).optional(),
  prioridade: z.enum(["alta", "media", "baixa"]).optional(),
  progresso: z.number().int().min(0).max(100).nullable().optional(),
  bloqueioMotivo: z.string().trim().max(500).nullable().optional(),
  bloqueioInfo: z.string().trim().max(500).nullable().optional(),
  descricao: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; tarefaId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, tarefaId } = await ctx.params;
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
  if (data.etapaId) {
    const [etapaDaObra] = await db
      .select({ id: obraEtapas.id, nome: obraEtapas.nome })
      .from(obraEtapas)
      .where(and(eq(obraEtapas.id, data.etapaId), eq(obraEtapas.obraId, id)))
      .limit(1);
    if (!etapaDaObra) {
      const r = NextResponse.json({ message: "Selecione uma etapa válida desta obra." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    updateData.etapaId = etapaDaObra.id;
    updateData.etapa = etapaDaObra.nome;
  } else if (data.etapaId === null) {
    updateData.etapaId = null;
    updateData.etapa = "Geral";
  }
  if (data.status === "concluido" && data.progresso === undefined) updateData.progresso = 100;
  const updated = await db.transaction(async (tx) => {
    // Serializa com a atualização de progresso/medição, que usa o mesmo lock.
    await tx.execute(sql`SELECT id FROM obras WHERE id = ${id} FOR UPDATE`);
    const [existing] = await tx.select().from(obraTarefas)
      .where(and(eq(obraTarefas.id, tarefaId), eq(obraTarefas.obraId, id)))
      .limit(1);
    if (!existing) return null;
    const [row] = await tx
      .update(obraTarefas)
      .set(updateData)
      .where(and(eq(obraTarefas.id, tarefaId), eq(obraTarefas.obraId, id)))
      .returning();
    const shouldRecalculate = data.etapaId !== undefined || data.progresso !== undefined || data.status !== undefined;
    if (shouldRecalculate) {
      const affectedStageIds = new Set([existing.etapaId, row.etapaId].filter((stageId): stageId is string => Boolean(stageId)));
      for (const stageId of affectedStageIds) {
        const [avg] = await tx.select({
          progresso: sql<number>`COALESCE(ROUND(AVG(COALESCE(${obraTarefas.progresso}, 0))), 0)::int`,
        }).from(obraTarefas).where(eq(obraTarefas.etapaId, stageId));
        const progressoEtapa = Number(avg?.progresso ?? 0);
        await tx.update(obraEtapas).set({
          progresso: progressoEtapa,
          status: progressoEtapa === 100 ? "concluido" : progressoEtapa > 0 ? "em_andamento" : "pendente",
          updatedAt: new Date(),
        }).where(and(eq(obraEtapas.id, stageId), eq(obraEtapas.obraId, id)));
      }
    }
    return row;
  });
  if (!updated) {
    const r = NextResponse.json({ message: "Tarefa não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.tarefa.update",
    payload: { obraId: id, tarefaId, changes: Object.keys(data) },
    request,
  });
  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; tarefaId: string }> },
) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, tarefaId } = await ctx.params;
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
  const deleted = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT id FROM obras WHERE id = ${id} FOR UPDATE`);
    const [existing] = await tx.select({ id: obraTarefas.id, etapaId: obraTarefas.etapaId })
      .from(obraTarefas)
      .where(and(eq(obraTarefas.id, tarefaId), eq(obraTarefas.obraId, id)))
      .limit(1);
    if (!existing) return false;
    await tx.delete(obraTarefas)
      .where(and(eq(obraTarefas.id, tarefaId), eq(obraTarefas.obraId, id)));
    if (existing.etapaId) {
      const [avg] = await tx.select({
        progresso: sql<number>`COALESCE(ROUND(AVG(COALESCE(${obraTarefas.progresso}, 0))), 0)::int`,
      }).from(obraTarefas).where(eq(obraTarefas.etapaId, existing.etapaId));
      const progressoEtapa = Number(avg?.progresso ?? 0);
      await tx.update(obraEtapas).set({
        progresso: progressoEtapa,
        status: progressoEtapa === 100 ? "concluido" : progressoEtapa > 0 ? "em_andamento" : "pendente",
        updatedAt: new Date(),
      }).where(and(eq(obraEtapas.id, existing.etapaId), eq(obraEtapas.obraId, id)));
    }
    return true;
  });
  if (!deleted) {
    const r = NextResponse.json({ message: "Tarefa não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.tarefa.delete",
    payload: { obraId: id, tarefaId },
    request,
  });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
