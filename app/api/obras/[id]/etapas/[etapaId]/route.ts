import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraEtapas } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

const patchSchema = z.object({
  nome: z.string().trim().min(2).max(160).optional(),
  descricao: z.string().trim().max(500).nullable().optional(),
  ordem: z.number().int().min(0).max(999).optional(),
  progresso: z.number().int().min(0).max(100).optional(),
  status: z.enum(["pendente", "em_andamento", "bloqueado", "concluido"]).optional(),
  responsavel: z.string().trim().max(120).nullable().optional(),
  prazo: z.string().datetime().nullable().optional(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string; etapaId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, etapaId } = await ctx.params;
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
  const [existing] = await db.select().from(obraEtapas).where(and(eq(obraEtapas.id, etapaId), eq(obraEtapas.obraId, id)));
  if (!existing) {
    const r = NextResponse.json({ message: "Etapa não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const body = await request.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  const data = parsed.data;
  // Empreiteiro: só pode mexer em progresso e status (não no escopo)
  if (access.role === "empreiteiro") {
    const allowed = ["progresso", "status"] as const;
    for (const k of Object.keys(data)) {
      if (!allowed.includes(k as typeof allowed[number])) {
        const r = NextResponse.json({ message: "Empreiteiro só pode atualizar progresso/status." }, { status: 403 });
        setNoCacheHeaders(r);
        return r;
      }
    }
  }
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (data.nome !== undefined) updateData.nome = data.nome;
  if (data.descricao !== undefined) updateData.descricao = data.descricao;
  if (data.ordem !== undefined) updateData.ordem = data.ordem;
  if (data.progresso !== undefined) updateData.progresso = data.progresso;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.responsavel !== undefined) updateData.responsavel = data.responsavel;
  if (data.prazo !== undefined) updateData.prazo = data.prazo ? new Date(data.prazo) : null;
  // Auto-coerência: progresso=100 ⇒ status=concluido
  if (data.progresso === 100 && data.status === undefined) updateData.status = "concluido";
  const [updated] = await db.update(obraEtapas).set(updateData).where(eq(obraEtapas.id, etapaId)).returning();
  await recordAudit({ actorId: guard.user.id, action: "obras.etapa.update", payload: { obraId: id, etapaId, changes: Object.keys(data) }, request });
  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string; etapaId: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { id, etapaId } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (access.role === "empreiteiro") {
    const r = NextResponse.json({ message: "Sem permissão." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  await db.delete(obraEtapas).where(and(eq(obraEtapas.id, etapaId), eq(obraEtapas.obraId, id)));
  await recordAudit({ actorId: guard.user.id, action: "obras.etapa.delete", payload: { obraId: id, etapaId }, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
