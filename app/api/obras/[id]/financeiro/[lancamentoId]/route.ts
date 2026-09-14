import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { financeiro } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";
import { LANCAMENTO_CATEGORIAS } from "@features/financeiro/lancamentos";
import { validarComprovante } from "@features/financeiro/api/validar-comprovante";

/**
 * XG10 — edição e exclusão de um lançamento da obra. O cliente pediu para
 * "na própria tab adicionarmos e editarmos", em vez de ter que apagar e
 * relançar quando erra um valor ou a descrição.
 *
 * O `tipo` é deliberadamente imutável: trocar entrada por saída inverteria o
 * sinal no caixa e exigiria mexer em recebedor/pagador. Para isso, exclua e
 * lance de novo.
 */

const patchSchema = z
  .object({
    categoria: z.enum(LANCAMENTO_CATEGORIAS).nullable().optional(),
    descricao: z.string().trim().min(2).max(500).optional(),
    valor: z.number().positive().max(999_999_999).optional(),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD").optional(),
    comprovanteFileId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nada para atualizar." });

/** Carrega o lançamento garantindo que ele pertence à obra da URL. */
async function carregarLancamento(obraId: string, lancamentoId: string) {
  const [row] = await db
    .select()
    .from(financeiro)
    .where(
      and(
        eq(financeiro.id, lancamentoId),
        eq(financeiro.obraId, obraId),
        eq(financeiro.escopo, "obra"),
      ),
    );
  return row ?? null;
}

async function autorizar(request: NextRequest, obraId: string) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return { error: guard.error as NextResponse };

  const access = await findObraAccess(obraId, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return { error: r };
  }
  if (!canWriteObraContent(access)) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return { error: r };
  }
  return { userId: guard.user.id };
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; lancamentoId: string }> },
) {
  const { id, lancamentoId } = await ctx.params;
  const auth = await autorizar(request, id);
  if (auth.error) return auth.error;

  const existing = await carregarLancamento(id, lancamentoId);
  if (!existing) {
    const r = NextResponse.json({ message: "Lançamento não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Lançamento vindo de medição ou de webhook tem origem própria; editar aqui
  // criaria divergência com a fonte que o gerou.
  if (existing.medicaoId || existing.origemId) {
    const r = NextResponse.json(
      { message: "Lançamento gerado automaticamente não pode ser editado." },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const data = parsed.data;
  if (data.categoria !== undefined && existing.tipo === "entrada" && data.categoria !== null) {
    const r = NextResponse.json({ message: "Entrada não tem categoria de despesa." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  if (data.categoria === null && existing.tipo === "saida") {
    const r = NextResponse.json({ message: "Saída precisa de categoria." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const erroComprovante = await validarComprovante(data.comprovanteFileId, auth.userId!);
  if (erroComprovante) {
    const r = NextResponse.json({ message: erroComprovante }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const updateData: Partial<typeof financeiro.$inferInsert> = {};
  if (data.categoria !== undefined) updateData.categoria = data.categoria;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.valor !== undefined) updateData.valor = String(data.valor);
  if (data.data !== undefined) {
    updateData.data = data.data;
    updateData.dataPagamento = data.data;
  }
  if (data.comprovanteFileId !== undefined) updateData.comprovanteFileId = data.comprovanteFileId;

  const [updated] = await db
    .update(financeiro)
    .set(updateData)
    .where(eq(financeiro.id, lancamentoId))
    .returning();

  await recordAudit({
    actorId: auth.userId!,
    action: "obras.financeiro.update",
    payload: { obraId: id, lancamentoId, changes: Object.keys(data) },
    request,
  });

  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; lancamentoId: string }> },
) {
  const { id, lancamentoId } = await ctx.params;
  const auth = await autorizar(request, id);
  if (auth.error) return auth.error;

  const existing = await carregarLancamento(id, lancamentoId);
  if (!existing) {
    const r = NextResponse.json({ message: "Lançamento não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (existing.medicaoId || existing.origemId) {
    const r = NextResponse.json(
      { message: "Lançamento gerado automaticamente não pode ser excluído." },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  await db.delete(financeiro).where(eq(financeiro.id, lancamentoId));

  await recordAudit({
    actorId: auth.userId!,
    action: "obras.financeiro.delete",
    payload: { obraId: id, lancamentoId },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
