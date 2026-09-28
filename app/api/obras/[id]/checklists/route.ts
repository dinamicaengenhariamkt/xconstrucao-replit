import { NextRequest, NextResponse } from "next/server";
import { asc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraChecklistItens, obraChecklists } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canAccessObraArea, canWriteObraArea } from "@features/obras/api/access";
import { carregarMarcacoes, projetarChecklist } from "@features/obras/api/checklist-recorrencia";

const createSchema = z.object({
  nome: z.string().trim().min(2).max(160),
  tipo: z.enum(["seguranca", "diario", "etapa"]).optional(),
  descricao: z.string().trim().max(500).optional().default(""),
  // XG21 — recorrência. Opcional: quem não manda segue com 'nenhuma'.
  recorrencia: z.enum(["nenhuma", "diaria", "semanal"]).optional(),
  recorrenciaDiaSemana: z.number().int().min(0).max(6).nullable().optional(),
  itens: z
    .array(z.object({ titulo: z.string().trim().min(1).max(240) }))
    .min(1)
    .max(100),
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
  if (!canAccessObraArea(access, "cronograma")) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const lists = await db
    .select()
    .from(obraChecklists)
    .where(eq(obraChecklists.obraId, id))
    .orderBy(asc(obraChecklists.createdAt));
  const ids = lists.map((l) => l.id);
  const itens =
    ids.length > 0
      ? await db
          .select()
          .from(obraChecklistItens)
          .where(inArray(obraChecklistItens.checklistId, ids))
          .orderBy(asc(obraChecklistItens.ordem), asc(obraChecklistItens.createdAt))
      : [];
  const byList = new Map<string, typeof itens>();
  for (const it of itens) {
    const arr = byList.get(it.checklistId) ?? [];
    arr.push(it);
    byList.set(it.checklistId, arr);
  }
  // XG21 — para checklist recorrente, o que vale é o período corrente: os itens
  // voltam desmarcados sozinhos quando o dia (ou a semana) vira, sem nenhum job.
  const marcacoes = await carregarMarcacoes(lists);
  const rows = lists.map((l) => {
    const p = projetarChecklist(l, byList.get(l.id) ?? [], marcacoes);
    return {
      ...l,
      itens: p.itens,
      status: p.status,
      completadoEm: p.completadoEm,
      periodoRef: p.periodoRef,
      pendenteNoPeriodo: p.pendenteNoPeriodo,
    };
  });
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
  if (!canWriteObraArea(access, "cronograma")) {
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
  const { nome, tipo, descricao, itens, recorrencia, recorrenciaDiaSemana } = parsed.data;
  const recorrenciaFinal = recorrencia ?? "nenhuma";
  const [created] = await db
    .insert(obraChecklists)
    .values({
      obraId: id,
      nome,
      tipo: tipo ?? "seguranca",
      descricao: descricao ?? "",
      recorrencia: recorrenciaFinal,
      // O dia da semana só faz sentido para 'semanal'; nos outros casos fica
      // null para não guardar dado que ninguém lê.
      recorrenciaDiaSemana: recorrenciaFinal === "semanal" ? (recorrenciaDiaSemana ?? 1) : null,
    })
    .returning();
  const inserted = await db
    .insert(obraChecklistItens)
    .values(
      itens.map((it, idx) => ({
        checklistId: created.id,
        titulo: it.titulo,
        ordem: idx,
      })),
    )
    .returning();
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.checklist.create",
    payload: { obraId: id, checklistId: created.id, nome, itens: inserted.length },
    request,
  });
  const r = NextResponse.json({ ...created, itens: inserted }, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
