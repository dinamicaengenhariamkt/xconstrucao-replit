import { NextRequest, NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { atividades, obraDiario } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders, isAdminLike } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraArea } from "@features/obras/api/access";

const updateSchema = z.object({ texto: z.string().trim().min(2).max(2000) });

function resposta(body: unknown, status = 200) {
  const r = NextResponse.json(body, { status });
  setNoCacheHeaders(r);
  return r;
}

/** Edita o texto de um registro. Só na obra própria do xgestão e só pelo autor. */
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string; entryId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, entryId } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) return resposta({ message: "Obra não encontrada" }, 404);
  if (!canWriteObraArea(access, "diario")) return resposta({ message: "Sem permissão." }, 403);
  const obraPropria =
    access.role === "empreiteiro" &&
    access.obra.clienteId === null &&
    access.obra.empreiteiraId === access.empreiteiraId;
  if (!obraPropria) return resposta({ message: "Sem permissão." }, 403);
  const parsed = updateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return resposta({ message: "Dados inválidos", errors: parsed.error.flatten() }, 400);
  }
  const [entry] = await db.select().from(obraDiario).where(and(eq(obraDiario.id, entryId), eq(obraDiario.obraId, id)));
  if (!entry) return resposta({ message: "Registro não encontrado" }, 404);
  if (entry.autorId !== guard.user.id) return resposta({ message: "Sem permissão." }, 403);
  const { texto } = parsed.data;
  const [updated] = await db.update(obraDiario).set({ texto }).where(eq(obraDiario.id, entryId)).returning();
  // O texto anterior fica na auditoria, já que o diário é registro da obra.
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.diario.update",
    payload: { obraId: id, diarioId: entryId, textoAnterior: entry.texto },
  });
  // A prévia guardada no feed não pode conservar um texto que o autor corrigiu.
  await db.update(atividades)
    .set({ payload: sql`jsonb_set(${atividades.payload}::jsonb, '{preview}', to_jsonb(${texto.slice(0, 140)}::text))` })
    .where(and(
      eq(atividades.obraId, id),
      eq(atividades.tipo, "diario_postado"),
      sql`${atividades.payload}->>'diarioId' = ${entryId}`,
    ));
  return resposta(updated);
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string; entryId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, entryId } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!canWriteObraArea(access, "diario")) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const [entry] = await db.select().from(obraDiario).where(and(eq(obraDiario.id, entryId), eq(obraDiario.obraId, id)));
  if (!entry) {
    const r = NextResponse.json({ message: "Registro não encontrado" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  // Autor pode deletar o próprio. Admin/contratante dono também.
  const canDelete = entry.autorId === guard.user.id || isAdminLike(guard.user.role) || access.role === "contratante";
  if (!canDelete) {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  await db.delete(obraDiario).where(eq(obraDiario.id, entryId));
  await recordAudit({ actorId: guard.user.id, action: "obras.diario.delete", payload: { obraId: id, diarioId: entryId }, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
