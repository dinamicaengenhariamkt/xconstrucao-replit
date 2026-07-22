import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { db } from "@shared/db/db";
import { asaasSubcontas, pagamentosSplit, users } from "@shared/db/schema";
import { createPaymentWithSplit } from "@shared/lib/asaas-client";
import { findOrCreateCustomer } from "@features/planos/gateway/asaas-gateway";
import { getPercentualPlataforma } from "@features/admin/platform-settings/server/settings-reader";
import { isMarketplaceSplitEnabled } from "./flags";
import type { LancamentoRow } from "@features/financeiro/lancamentos-service";

/**
 * J47 — Iniciação do checkout de obra com split. Calcula a divisão
 * (comissão da plataforma × repasse do empreiteiro), cria a cobrança no Asaas
 * com `split` destinando o repasse ao walletId da subconta, e registra
 * `pagamentos_split` como `pendente`. O `financeiro` NÃO muda de status aqui —
 * isso só ocorre na confirmação por webhook (J48).
 */

export type CheckoutSplitResult =
  | { ok: true; invoiceUrl: string; splitId: string; asaasPaymentId: string }
  | { ok: false; code: "SPLIT_DESABILITADO" }
  | { ok: false; code: "SUBCONTA_NAO_APROVADA"; detail: string }
  | { ok: false; code: "RECEBEDOR_INDEFINIDO"; detail: string }
  | { ok: false; code: "INTERNAL_ERROR"; detail: string };

/** Datas de vencimento: hoje + N dias, formato YYYY-MM-DD (sem hora). */
function dueDateFromNow(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Dado um conjunto de userIds (recebedores), retorna o subconjunto que tem
 * subconta APROVADA com walletId — ou seja, aptos a receber via split.
 * Usado pela tela de pagamentos para decidir se mostra "Pagar via plataforma"
 * sem uma query por linha. Retorna Set vazio se o split estiver desabilitado.
 */
export async function filtrarRecebedoresAptos(userIds: string[]): Promise<Set<string>> {
  if (!isMarketplaceSplitEnabled() || userIds.length === 0) return new Set();
  const rows = await db
    .select({ userId: asaasSubcontas.userId })
    .from(asaasSubcontas)
    .where(
      and(
        inArray(asaasSubcontas.userId, userIds),
        eq(asaasSubcontas.onboardingStatus, "aprovada"),
        isNotNull(asaasSubcontas.walletId),
      ),
    );
  return new Set(rows.map((r) => r.userId));
}

/**
 * Inicia o checkout com split para um lançamento de obra.
 * Pré-condições (guard de ownership/status/disputa) são validadas no route
 * handler ANTES de chamar isto — aqui cuidamos só do split/Asaas.
 */
export async function iniciarCheckoutSplit(args: {
  lancamento: LancamentoRow;
  pagadorUserId: string;
}): Promise<CheckoutSplitResult> {
  try {
    if (!isMarketplaceSplitEnabled()) {
      return { ok: false, code: "SPLIT_DESABILITADO" };
    }

    const { lancamento } = args;
    const recebedorUserId = lancamento.recebedorUserId;
    if (!recebedorUserId) {
      return {
        ok: false,
        code: "RECEBEDOR_INDEFINIDO",
        detail: "Não foi possível identificar o empreiteiro recebedor deste pagamento.",
      };
    }

    // Subconta do recebedor precisa estar APROVADA e com walletId.
    const [subconta] = await db
      .select({ walletId: asaasSubcontas.walletId, status: asaasSubcontas.onboardingStatus })
      .from(asaasSubcontas)
      .where(eq(asaasSubcontas.userId, recebedorUserId))
      .limit(1);
    if (!subconta || subconta.status !== "aprovada" || !subconta.walletId) {
      return {
        ok: false,
        code: "SUBCONTA_NAO_APROVADA",
        detail: "O empreiteiro ainda não concluiu a configuração de recebimento. Use o pagamento manual.",
      };
    }

    // Customer Asaas do pagador (provisionado em J44; fallback lazy por email).
    const [pagador] = await db
      .select({ name: users.name, email: users.email, asaasCustomerId: users.asaasCustomerId })
      .from(users)
      .where(eq(users.id, args.pagadorUserId))
      .limit(1);
    const customerId = pagador?.asaasCustomerId
      ? pagador.asaasCustomerId
      : (await findOrCreateCustomer(pagador?.email ?? "", pagador?.name ?? "Contratante")).id;

    // Cálculo do split (snapshot da regra no momento).
    const percentualPlataforma = await getPercentualPlataforma();
    const valorTotal = Number(lancamento.valor);
    const valorPlataforma = round2((valorTotal * percentualPlataforma) / 100);
    const valorEmpreiteiro = round2(valorTotal - valorPlataforma);

    // Cria o registro pendente ANTES de chamar o Asaas — assim temos o splitId
    // para o externalReference e um rastro mesmo se o Asaas falhar.
    const [split] = await db
      .insert(pagamentosSplit)
      .values({
        financeiroId: lancamento.id,
        obraId: lancamento.obraId,
        medicaoId: lancamento.medicaoId,
        pagadorUserId: args.pagadorUserId,
        recebedorUserId,
        valorTotal: String(valorTotal),
        valorPlataforma: String(valorPlataforma),
        valorEmpreiteiro: String(valorEmpreiteiro),
        percentualPlataforma: String(percentualPlataforma),
        walletIdEmpreiteiro: subconta.walletId,
        status: "pendente",
      })
      .returning({ id: pagamentosSplit.id });

    const externalReference = `xconstrucao-obra|${lancamento.id}|${lancamento.obraId ?? ""}|${split.id}`;

    let payment;
    try {
      payment = await createPaymentWithSplit({
        customer: customerId,
        billingType: "UNDEFINED", // deixa o pagador escolher PIX/Boleto/Cartão
        value: valorTotal,
        dueDate: dueDateFromNow(3),
        description: lancamento.descricao ?? `Pagamento de obra ${lancamento.obraNome ?? ""}`.trim(),
        externalReference,
        split: [{ walletId: subconta.walletId, fixedValue: valorEmpreiteiro }],
      });
    } catch (err) {
      // Marca o split como falho para reconciliação (J50) e propaga erro amigável.
      await db
        .update(pagamentosSplit)
        .set({ status: "falhou", updatedAt: new Date() })
        .where(eq(pagamentosSplit.id, split.id))
        .catch(() => {});
      throw err;
    }

    // Persiste o id/checkout do Asaas no registro (idempotência do webhook J48).
    await db
      .update(pagamentosSplit)
      .set({
        asaasPaymentId: payment.id,
        billingType: payment.billingType ?? null,
        updatedAt: new Date(),
      })
      .where(eq(pagamentosSplit.id, split.id));

    const invoiceUrl = payment.invoiceUrl;
    if (!invoiceUrl) {
      // Sem URL de pagamento não há como redirecionar — trata como erro.
      return {
        ok: false,
        code: "INTERNAL_ERROR",
        detail: "O gateway não retornou uma URL de pagamento.",
      };
    }

    return { ok: true, invoiceUrl, splitId: split.id, asaasPaymentId: payment.id };
  } catch (err) {
    console.error("[split-service] erro inesperado:", err);
    return { ok: false, code: "INTERNAL_ERROR", detail: String(err) };
  }
}
