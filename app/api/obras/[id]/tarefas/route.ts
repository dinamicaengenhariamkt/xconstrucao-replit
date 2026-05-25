import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraTarefas } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

const createSchema = z.object({
  titulo: z.string().trim().min(2).max(160),
  etapa: z.string().trim().max(160).optional().default(""),
  etapaId: z.string().trim().optional().nullable(),
  responsavel: z.string().trim().max(120).optional().default(""),
  prazo: z.string().trim().max(40).optional().default(""),
  status: z.enum(["pendente", "em_andamento", "bloqueado", "concluido"]).optional(),
  prioridade: z.enum(["alta", "media", "baixa"]).optional(),
  progresso: z.number().int().min(0).max(100).optional().nullable(),
  bloqueioMotivo: z.string().trim().max(500).optional().nullable(),
  bloqueioInfo: z.string().trim().max(500).optional().nullable(),
  descricao: z.string().trim().max(2000).optional().nullable(),
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
    .from(obraTarefas)
    .where(eq(obraTarefas.obraId, id))
    .orderBy(asc(obraTarefas.createdAt));
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
  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
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
    .insert(obraTarefas)
    .values({
      obraId: id,
      etapaId: data.etapaId ?? null,
      etapa: data.etapa ?? "",
      titulo: data.titulo,
      descricao: data.descricao ?? null,
      responsavel: data.responsavel ?? "",
      prazo: data.prazo ?? "",
      status: data.status ?? "pendente",
      prioridade: data.prioridade ?? "media",
      progresso: data.progresso ?? null,
      bloqueioMotivo: data.bloqueioMotivo ?? null,
      bloqueioInfo: data.bloqueioInfo ?? null,
    })
    .returning();
  await recordAudit({
    actorId: guard.user.id,
    action: "obras.tarefa.create",
    payload: { obraId: id, tarefaId: created.id, titulo: created.titulo },
    request,
  });
  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
