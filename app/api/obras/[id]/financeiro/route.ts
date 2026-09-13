import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { empreiteiras, financeiro } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";
import { registrarAtividade } from "@features/atividades/api/registrar";
import {
  LANCAMENTO_CATEGORIAS,
  LANCAMENTO_TIPOS,
  type LancamentoCategoria,
} from "@features/financeiro/lancamentos";

/**
 * XG10 — lançamentos financeiros da obra (entrada e saída).
 *
 * A reunião de 2026-09-12 abriu com o relato de que não havia onde lançar nem
 * pagamento a prestador nem recebimento de cliente. Até aqui, mexer em dinheiro
 * só era possível pelo `RegistrarMedicaoModal`, que amarra valor a avanço
 * físico — daí a pergunta do cliente: "como eu lanço a entrada do cliente, sem
 * ter etapa feita?". Esta rota separa as duas coisas: medição mede obra,
 * lançamento registra dinheiro.
 *
 * `recebedorUserId`/`pagadorUserId` são preenchidos no servidor com o dono da
 * obra. São eles que fazem `receitaTotal`/`custoTotal` somarem em
 * `build-detalhe-server.ts` — sem isso o lançamento existe no banco mas não
 * aparece na tela ("receita total não está puxando").
 */

const createSchema = z.object({
  tipo: z.enum(LANCAMENTO_TIPOS),
  // Só faz sentido em saída, para separar mão de obra de material. A coerência
  // com o tipo é validada depois do parse (refine não compõe bem com o PATCH).
  categoria: z.enum(LANCAMENTO_CATEGORIAS).optional().nullable(),
  descricao: z.string().trim().min(2).max(500),
  valor: z.number().positive().max(999_999_999),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD"),
  comprovanteFileId: z.string().uuid().optional().nullable(),
});

function validarCategoria(
  tipo: string,
  categoria: LancamentoCategoria | null | undefined,
): string | null {
  if (tipo === "saida" && !categoria) {
    return "Informe a categoria da saída (mão de obra, material ou outras despesas).";
  }
  if (tipo === "entrada" && categoria) {
    return "Entrada não tem categoria de despesa.";
  }
  return null;
}

/** Dono da obra, para creditar/debitar o lançamento na pessoa certa. */
async function resolverDonoUserId(empreiteiraId: string | null): Promise<string | null> {
  if (!empreiteiraId) return null;
  const [emp] = await db
    .select({ userId: empreiteiras.userId })
    .from(empreiteiras)
    .where(eq(empreiteiras.id, empreiteiraId));
  return emp?.userId ?? null;
}

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
    .from(financeiro)
    .where(and(eq(financeiro.obraId, id), eq(financeiro.escopo, "obra")))
    .orderBy(asc(financeiro.data));

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

  const { tipo, categoria, descricao, valor, data, comprovanteFileId } = parsed.data;
  const erroCategoria = validarCategoria(tipo, categoria);
  if (erroCategoria) {
    const r = NextResponse.json({ message: erroCategoria }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const donoUserId = await resolverDonoUserId(access.obra.empreiteiraId);

  const [created] = await db
    .insert(financeiro)
    .values({
      obraId: id,
      escopo: "obra",
      tipo,
      categoria: categoria ?? null,
      descricao,
      valor: String(valor),
      data,
      // Lançamento manual registra fato consumado, não previsão: nasce pago,
      // que é o status somado por receitaTotal/custoTotal.
      status: "pago",
      dataPagamento: data,
      comprovanteFileId: comprovanteFileId ?? null,
      recebedorUserId: tipo === "entrada" ? donoUserId : null,
      pagadorUserId: tipo === "saida" ? donoUserId : null,
    })
    .returning();

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.financeiro.create",
    payload: { obraId: id, lancamentoId: created.id, tipo, valor },
    request,
  });
  void registrarAtividade({
    tipo: "lancamento_criado",
    actorUserId: guard.user.id,
    obraId: id,
    payload: { lancamentoId: created.id, valor, tipo, origem: "manual" },
  });

  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
