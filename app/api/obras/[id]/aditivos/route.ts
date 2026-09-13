import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { obraAditivos } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

/**
 * XG10 — aditivos de contrato da obra.
 *
 * "Aqui tem aditivo, só que eu não vi local para colocar. Eu tenho que poder
 * lançar também aditivos" (12:15). O card existia no resumo financeiro lendo
 * um zero fixo; aqui nasce a fonte do dado.
 */

const createSchema = z.object({
  descricao: z.string().trim().min(2).max(500),
  // Assinado: aditivo de supressão reduz o escopo contratado. Zero não é
  // aditivo — seria só ruído no extrato.
  valor: z.number().refine((v) => v !== 0, "Informe um valor diferente de zero").
    refine((v) => Math.abs(v) <= 999_999_999, "Valor fora do limite"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD"),
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
    .from(obraAditivos)
    .where(eq(obraAditivos.obraId, id))
    .orderBy(asc(obraAditivos.data), asc(obraAditivos.createdAt));

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
  // Marketplace: aditivo altera o valor do contrato, que é decisão do
  // contratante. No xgestão a obra não tem contratante — o dono decide.
  if (access.role === "empreiteiro" && access.obra.clienteId !== null) {
    const r = NextResponse.json(
      { message: "Apenas o contratante pode lançar aditivos." },
      { status: 403 },
    );
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

  const { descricao, valor, data } = parsed.data;
  const [created] = await db
    .insert(obraAditivos)
    .values({
      obraId: id,
      descricao,
      valor: String(valor),
      data,
      criadoPor: guard.user.id,
    })
    .returning();

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.aditivo.create",
    payload: { obraId: id, aditivoId: created.id, valor },
    request,
  });

  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
