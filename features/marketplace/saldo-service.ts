import { eq, desc } from "drizzle-orm";
import { db } from "@shared/db/db";
import { asaasSubcontas, saques, type Saque } from "@shared/db/schema";
import { getBalance, requestTransfer, type AsaasTransferInput } from "@shared/lib/asaas-client";
import { decrypt } from "@shared/lib/crypto-vault";
import { isMarketplaceSplitEnabled } from "./flags";

/**
 * J49 — Saldo e saque do empreiteiro. Decifra a apiKey da subconta (só em
 * memória, nunca logada nem exposta ao client) para consultar `getBalance` e
 * disparar `requestTransfer` no CONTEXTO da subconta.
 */

type SubcontaOperavel = {
  apiKey: string;
  tipoConta: string | null;
  pixChave: string | null;
  pixTipo: string | null;
  bancoCodigo: string | null;
  agencia: string | null;
  conta: string | null;
  contaDigito: string | null;
  contaTipo: string | null;
  titularNome: string | null;
  titularCpfCnpj: string | null;
};

/**
 * Carrega a subconta APROVADA de um empreiteiro e decifra sua apiKey.
 * Retorna null se não existe, não está aprovada, ou não tem apiKey cifrada.
 */
async function carregarSubcontaOperavel(userId: string): Promise<SubcontaOperavel | null> {
  const [sub] = await db
    .select()
    .from(asaasSubcontas)
    .where(eq(asaasSubcontas.userId, userId))
    .limit(1);
  if (!sub || sub.onboardingStatus !== "aprovada" || !sub.asaasApiKeyEnc) return null;

  let apiKey: string;
  try {
    apiKey = decrypt(sub.asaasApiKeyEnc);
  } catch (err) {
    console.error(`[saldo-service] falha ao decifrar apiKey da subconta (userId=${userId})`);
    return null;
  }
  return {
    apiKey,
    tipoConta: sub.tipoConta,
    pixChave: sub.pixChave,
    pixTipo: sub.pixTipo,
    bancoCodigo: sub.bancoCodigo,
    agencia: sub.agencia,
    conta: sub.conta,
    contaDigito: sub.contaDigito,
    contaTipo: sub.contaTipo,
    titularNome: sub.titularNome,
    titularCpfCnpj: sub.titularCpfCnpj,
  };
}

export type SaldoResult =
  | { ok: true; saldo: number }
  | { ok: false; code: "SPLIT_DESABILITADO" | "SUBCONTA_NAO_APROVADA" | "INTERNAL_ERROR"; detail?: string };

/** Consulta o saldo real da subconta do empreiteiro. */
export async function consultarSaldo(userId: string): Promise<SaldoResult> {
  try {
    if (!isMarketplaceSplitEnabled()) return { ok: false, code: "SPLIT_DESABILITADO" };
    const sub = await carregarSubcontaOperavel(userId);
    if (!sub) return { ok: false, code: "SUBCONTA_NAO_APROVADA" };
    const { balance } = await getBalance(sub.apiKey);
    return { ok: true, saldo: Number(balance) };
  } catch (err) {
    console.error("[saldo-service] consultarSaldo falhou:", err);
    return { ok: false, code: "INTERNAL_ERROR", detail: String(err) };
  }
}

export type SaqueResult =
  | { ok: true; saque: Saque }
  | {
      ok: false;
      code: "SPLIT_DESABILITADO" | "SUBCONTA_NAO_APROVADA" | "VALOR_INVALIDO" | "SALDO_INSUFICIENTE" | "INTERNAL_ERROR";
      detail?: string;
    };

/**
 * Solicita um saque (transferência da subconta para o banco/PIX cadastrado).
 * Guards: valor > 0, ≤ saldo real, subconta aprovada. Registra o saque local
 * (`saques`) para histórico/reconciliação (J50).
 */
export async function solicitarSaque(userId: string, valor: number): Promise<SaqueResult> {
  try {
    if (!isMarketplaceSplitEnabled()) return { ok: false, code: "SPLIT_DESABILITADO" };
    if (!Number.isFinite(valor) || valor <= 0) {
      return { ok: false, code: "VALOR_INVALIDO", detail: "Informe um valor de saque maior que zero." };
    }

    const sub = await carregarSubcontaOperavel(userId);
    if (!sub) return { ok: false, code: "SUBCONTA_NAO_APROVADA" };

    // Não sacar acima do saldo real.
    const { balance } = await getBalance(sub.apiKey);
    if (valor > Number(balance)) {
      return { ok: false, code: "SALDO_INSUFICIENTE", detail: "Valor solicitado excede o saldo disponível." };
    }

    // Monta o destino da transferência a partir dos dados de recebimento (J45).
    const transferInput = montarTransferInput(sub, valor);

    // Registra o saque como pendente ANTES de chamar o Asaas (rastro).
    const [saque] = await db
      .insert(saques)
      .values({ userId, valor: String(valor), status: "pendente", metodo: sub.tipoConta })
      .returning();

    let transfer;
    try {
      transfer = await requestTransfer(transferInput, sub.apiKey);
    } catch (err) {
      await db
        .update(saques)
        .set({ status: "falhou", erro: String(err), updatedAt: new Date() })
        .where(eq(saques.id, saque.id))
        .catch(() => {});
      return { ok: false, code: "INTERNAL_ERROR", detail: String(err) };
    }

    // Asaas costuma retornar PENDING/DONE. Só marca concluído em DONE.
    const concluido = transfer.status === "DONE" || transfer.status === "CONFIRMED";
    const [atualizado] = await db
      .update(saques)
      .set({
        asaasTransferId: transfer.id,
        status: concluido ? "concluido" : "pendente",
        updatedAt: new Date(),
      })
      .where(eq(saques.id, saque.id))
      .returning();

    return { ok: true, saque: atualizado };
  } catch (err) {
    console.error("[saldo-service] solicitarSaque falhou:", err);
    return { ok: false, code: "INTERNAL_ERROR", detail: String(err) };
  }
}

/** Histórico de saques do empreiteiro (mais recentes primeiro). */
export async function listarSaques(userId: string, limite = 20): Promise<Saque[]> {
  return db
    .select()
    .from(saques)
    .where(eq(saques.userId, userId))
    .orderBy(desc(saques.createdAt))
    .limit(limite);
}

function montarTransferInput(sub: SubcontaOperavel, valor: number): AsaasTransferInput {
  if (sub.tipoConta === "PIX" && sub.pixChave) {
    return {
      value: valor,
      pixAddressKey: sub.pixChave,
      pixAddressKeyType: sub.pixTipo ?? undefined,
    };
  }
  // TED — dados bancários.
  return {
    value: valor,
    bankAccount: {
      bank: { code: sub.bancoCodigo ?? "" },
      ownerName: sub.titularNome ?? "",
      cpfCnpj: sub.titularCpfCnpj ?? "",
      agency: sub.agencia ?? "",
      account: sub.conta ?? "",
      accountDigit: sub.contaDigito ?? "",
      bankAccountType: sub.contaTipo ?? undefined,
    },
  };
}
