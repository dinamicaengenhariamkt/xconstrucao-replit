import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraChecklistItens, obraChecklists } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";
import {
  alternarMarcacao,
  carregarMarcacoes,
  marcarTodosNoPeriodo,
  projetarChecklist,
} from "@features/obras/api/checklist-recorrencia";
import { periodoAtual } from "@features/empreiteiro/minhas-obras/lib/checklist-periodo";

const itemPatchSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(1).max(240),
  concluida: z.boolean().optional(),
});

const patchSchema = z.object({
  nome: z.string().trim().min(2).max(160).optional(),
  tipo: z.enum(["seguranca", "diario", "etapa"]).optional(),
  recorrencia: z.enum(["nenhuma", "diaria", "semanal"]).optional(),
  recorrenciaDiaSemana: z.number().int().min(0).max(6).nullable().optional(),
  descricao: z.string().trim().max(500).optional(),
  status: z.enum(["pendente", "em_andamento", "completo"]).optional(),
  completadoEm: z.string().max(40).nullable().optional(),
  assinadoPor: z.string().max(160).nullable().optional(),
  assinadoEm: z.string().max(40).nullable().optional(),
  registroProfissional: z.string().max(80).nullable().optional(),
  itens: z.array(itemPatchSchema).max(200).optional(),
  toggleItemId: z.string().optional(),
  markAllItens: z.boolean().optional(),
  /**
   * Reabertura de checklist concluído. Não muda nada do que é gravado — o
   * cliente já manda status e assinatura limpos no mesmo patch, e os itens são
   * preservados de propósito (quem reabre quer corrigir a assinatura, não
   * refazer a inspeção). Existe só para a auditoria distinguir "editei o nome"
   * de "apaguei uma assinatura profissional com CREA".
   */
  reabrir: z.boolean().optional(),
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

  /*
   * XG21 — com recorrência, o tique vira uma linha em
   * `obra_checklist_marcacoes` ancorada no período corrente, em vez de
   * sobrescrever `obra_checklist_itens.concluida`.
   *
   * A recorrência que vale é a do corpo quando ela veio no mesmo PATCH (o
   * usuário acabou de mudar), senão a que está gravada.
   */
  const recorrenciaEfetiva = data.recorrencia ?? existing.recorrencia;
  const diaSemanaEfetivo =
    data.recorrenciaDiaSemana !== undefined
      ? data.recorrenciaDiaSemana
      : existing.recorrenciaDiaSemana;
  const periodoRef = periodoAtual(recorrenciaEfetiva, diaSemanaEfetivo);

  // Toggle de item individual (mutação otimista do cliente)
  if (data.toggleItemId) {
    const [item] = await db
      .select()
      .from(obraChecklistItens)
      .where(
        and(eq(obraChecklistItens.id, data.toggleItemId), eq(obraChecklistItens.checklistId, checklistId)),
      );
    if (item) {
      if (periodoRef) {
        await alternarMarcacao(checklistId, item.ordem, periodoRef, guard.user.id);
      } else {
        await db
          .update(obraChecklistItens)
          .set({ concluida: !item.concluida })
          .where(eq(obraChecklistItens.id, item.id));
      }
    }
  }

  // Marcar todos como concluídos (finalizar / assinar)
  if (data.markAllItens) {
    if (periodoRef) {
      const todos = await db
        .select({ ordem: obraChecklistItens.ordem })
        .from(obraChecklistItens)
        .where(eq(obraChecklistItens.checklistId, checklistId));
      await marcarTodosNoPeriodo(
        checklistId,
        todos.map((t) => t.ordem),
        periodoRef,
        guard.user.id,
      );
    } else {
      await db
        .update(obraChecklistItens)
        .set({ concluida: true })
        .where(eq(obraChecklistItens.checklistId, checklistId));
    }
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
  for (const k of ["nome", "tipo", "descricao", "status", "completadoEm", "assinadoPor", "assinadoEm", "registroProfissional", "recorrencia", "recorrenciaDiaSemana"] as const) {
    if (data[k] !== undefined) updateData[k] = data[k];
  }
  // Trocar para 'semanal' sem dizer o dia ancora na segunda; sair de 'semanal'
  // limpa o dia, para não sobrar dado que ninguém lê.
  if (data.recorrencia === "semanal" && diaSemanaEfetivo == null) {
    updateData.recorrenciaDiaSemana = 1;
  } else if (data.recorrencia && data.recorrencia !== "semanal") {
    updateData.recorrenciaDiaSemana = null;
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

  // Projeta antes de responder: sem isto a UI receberia o estado da coluna
  // `concluida` (que não é mais a fonte da verdade para checklist recorrente) e
  // os tiques piscariam de volta ao valor antigo.
  const marcacoes = await carregarMarcacoes([updated]);
  const projetado = projetarChecklist(updated, itens, marcacoes);

  await recordAudit({
    actorId: guard.user.id,
    action: data.reabrir ? "obras.checklist.reabrir" : "obras.checklist.update",
    payload: data.reabrir
      ? {
          obraId: id,
          checklistId,
          // Guardar o que foi apagado: sem isto o log prova que houve
          // reabertura, mas não de quem era a assinatura descartada.
          assinaturaAnterior: existing.assinadoPor,
          assinadoEmAnterior: existing.assinadoEm,
          registroProfissionalAnterior: existing.registroProfissional,
        }
      : { obraId: id, checklistId, changes: Object.keys(data) },
    request,
  });
  const r = NextResponse.json({
    ...updated,
    itens: projetado.itens,
    status: projetado.status,
    completadoEm: projetado.completadoEm,
    periodoRef: projetado.periodoRef,
    pendenteNoPeriodo: projetado.pendenteNoPeriodo,
  });
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
