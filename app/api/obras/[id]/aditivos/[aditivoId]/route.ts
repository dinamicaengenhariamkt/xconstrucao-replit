import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraAditivos } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

/** XG10 — edição e exclusão de um aditivo da obra. */

const patchSchema = z
  .object({
    descricao: z.string().trim().min(2).max(500).optional(),
    valor: z
      .number()
      .refine((v) => v !== 0, "Informe um valor diferente de zero")
      .refine((v) => Math.abs(v) <= 999_999_999, "Valor fora do limite")
      .optional(),
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD").optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "Nada para atualizar." });

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
  if (access.role === "empreiteiro" && access.obra.clienteId !== null) {
    const r = NextResponse.json(
      { message: "Apenas o contratante pode alterar aditivos." },
      { status: 403 },
    );
    setNoCacheHeaders(r);
    return { error: r };
  }
  return { userId: guard.user.id };
}

/** Garante que o aditivo pertence à obra da URL (evita id de outra obra). */
async function carregar(obraId: string, aditivoId: string) {
  const [row] = await db
    .select()
    .from(obraAditivos)
    .where(and(eq(obraAditivos.id, aditivoId), eq(obraAditivos.obraId, obraId)));
  return row ?? null;
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; aditivoId: string }> },
) {
  const { id, aditivoId } = await ctx.params;
  const auth = await autorizar(request, id);
  if (auth.error) return auth.error;

  if (!(await carregar(id, aditivoId))) {
    const r = NextResponse.json({ message: "Aditivo não encontrado" }, { status: 404 });
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

  const updateData: Partial<typeof obraAditivos.$inferInsert> = {};
  if (parsed.data.descricao !== undefined) updateData.descricao = parsed.data.descricao;
  if (parsed.data.valor !== undefined) updateData.valor = String(parsed.data.valor);
  if (parsed.data.data !== undefined) updateData.data = parsed.data.data;

  const [updated] = await db
    .update(obraAditivos)
    .set(updateData)
    .where(eq(obraAditivos.id, aditivoId))
    .returning();

  await recordAudit({
    actorId: auth.userId!,
    action: "obras.aditivo.update",
    payload: { obraId: id, aditivoId, changes: Object.keys(parsed.data) },
    request,
  });

  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}

export async function DELETE(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; aditivoId: string }> },
) {
  const { id, aditivoId } = await ctx.params;
  const auth = await autorizar(request, id);
  if (auth.error) return auth.error;

  if (!(await carregar(id, aditivoId))) {
    const r = NextResponse.json({ message: "Aditivo não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  await db.delete(obraAditivos).where(eq(obraAditivos.id, aditivoId));

  await recordAudit({
    actorId: auth.userId!,
    action: "obras.aditivo.delete",
    payload: { obraId: id, aditivoId },
    request,
  });

  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
