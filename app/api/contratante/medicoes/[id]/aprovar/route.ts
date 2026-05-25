import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, medicoes, obras } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { assertMedicaoEditableByContratante, recomputeObraProgresso } from "../../_shared";
import { criarLancamentoFromMedicao } from "@features/financeiro/lancamentos-service";

const VENCIMENTO_DIAS_PADRAO = 15;

function addDaysIso(base: Date, dias: number): string {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;

  if (isRateLimited(`medicoes.aprovar:user:${guard.user.id}`, 60, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const check = await assertMedicaoEditableByContratante(id, { id: guard.user.id, role: guard.user.role });
  if (!check.ok) {
    const r = NextResponse.json({ message: check.message }, { status: check.status });
    setNoCacheHeaders(r);
    return r;
  }

  if (check.medicao.status !== "pendente") {
    const r = NextResponse.json(
      { message: `Esta medição já foi ${check.medicao.status === "aprovada" ? "aprovada" : "contestada"}.` },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Garante que aprovar não estoure 100% (soma das aprovadas já existentes + esta).
  const [agg] = await db
    .select({ soma: sql<string>`COALESCE(SUM(percentual), 0)` })
    .from(medicoes)
    .where(and(eq(medicoes.obraId, check.medicao.obraId), eq(medicoes.status, "aprovada")));

  const somaAprovada = Number(agg?.soma ?? 0);
  const novo = somaAprovada + Number(check.medicao.percentual);
  if (novo > 100.01) {
    const r = NextResponse.json(
      { message: `Aprovação ultrapassaria 100% concluído (atual aprovado: ${somaAprovada}%, esta medição: ${check.medicao.percentual}%).` },
      { status: 422 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Resolver userId do contratante (pagadorUserId) via clientes.userId.
  let pagadorUserId: string | null = null;
  if (check.obra.clienteId) {
    const [cli] = await db
      .select({ userId: clientes.userId })
      .from(clientes)
      .where(eq(clientes.id, check.obra.clienteId));
    pagadorUserId = cli?.userId ?? null;
  }

  // Valor do lançamento: se a medição já tem valor declarado (>0) usa esse;
  // se não, calcula proporcional sobre `obras.valorTotal × percentual / 100`.
  const valorMedicao = Number(check.medicao.valor ?? 0);
  const valorObra = Number(check.obra.valorTotal ?? 0);
  const percentual = Number(check.medicao.percentual ?? 0);
  const valorLancamento =
    valorMedicao > 0 ? valorMedicao : Math.round(((valorObra * percentual) / 100) * 100) / 100;
  const dataVencimento = addDaysIso(new Date(), VENCIMENTO_DIAS_PADRAO);
  const descricaoLanc = `Medição #${check.medicao.numero} — ${check.medicao.etapa}`;

  // Transação atômica: aprovação + lançamento financeiro. Se qualquer ponto
  // falhar, NADA é persistido (sem medição aprovada sem fatura, e vice-versa).
  // Idempotência da fatura: UNIQUE em financeiro.medicao_id + try/catch 23505
  // dentro de `criarLancamentoFromMedicao`.
  let updatedRow: typeof medicoes.$inferSelect;
  let lancamentoId: string | null = null;
  let lancamentoValor = 0;
  let lancamentoSkipReason: string | null = null;
  try {
    const txResult = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(medicoes)
        .set({ status: "aprovada", decidedAt: new Date(), decidedBy: guard.user.id, motivoContestacao: null })
        .where(eq(medicoes.id, id))
        .returning();

      let lanc: { id: string; valor: number } | null = null;
      // Skip explícito (não silencioso): se faltar pagador ou valor, registra
      // o motivo. Aprovação ainda passa, mas o audit deixa rastro pra ops.
      const skipReason =
        !pagadorUserId
          ? "obra_sem_contratante_user"
          : !check.medicao.empreiteiroId
            ? "medicao_sem_empreiteiro"
            : valorLancamento <= 0
              ? "valor_zero"
              : null;
      if (skipReason) {
        console.warn(
          `[medicoes.aprovar] lançamento NÃO criado para medicao=${id} obra=${check.medicao.obraId} motivo=${skipReason} valor=${valorLancamento}`,
        );
      }
      if (!skipReason) {
        const created = await criarLancamentoFromMedicao({
          medicaoId: id,
          obraId: check.medicao.obraId,
          valor: valorLancamento,
          descricao: descricaoLanc,
          pagadorUserId: pagadorUserId!,
          recebedorUserId: check.medicao.empreiteiroId,
          dataVencimento,
          categoria: "Medição",
          tx,
        });
        lanc = { id: created.id, valor: created.valor };
      }

      return { updated, lanc, skipReason };
    });
    updatedRow = txResult.updated;
    lancamentoId = txResult.lanc?.id ?? null;
    lancamentoValor = txResult.lanc?.valor ?? 0;
    lancamentoSkipReason = txResult.skipReason ?? null;
  } catch (err) {
    console.error("[medicoes.aprovar] falha na transação:", err);
    const r = NextResponse.json(
      { message: "Não foi possível aprovar a medição. Tente novamente." },
      { status: 500 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Progresso fora da transação (cálculo derivado, idempotente — pode rerodar).
  const progresso = await recomputeObraProgresso(check.medicao.obraId);

  await recordAudit({
    actorId: guard.user.id,
    action: "medicoes.aprovar",
    targetUserId: check.medicao.empreiteiroId,
    payload: {
      medicaoId: id,
      obraId: check.medicao.obraId,
      percentual: Number(check.medicao.percentual),
      novoProgresso: progresso,
      lancamentoId,
      lancamentoSkipReason,
    },
    request,
  });

  if (lancamentoId) {
    await recordAudit({
      actorId: guard.user.id,
      action: "financeiro.criar.from-medicao",
      targetUserId: check.medicao.empreiteiroId,
      payload: {
        medicaoId: id,
        obraId: check.medicao.obraId,
        lancamentoId,
        valor: lancamentoValor,
        dataVencimento,
      },
      request,
    });
  }

  const r = NextResponse.json({ ...updatedRow, progresso, lancamentoId });
  setNoCacheHeaders(r);
  return r;
}
