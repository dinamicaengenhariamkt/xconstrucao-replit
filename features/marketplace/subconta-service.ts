import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { asaasSubcontas, empreiteiras, users, type AsaasSubconta } from "@shared/db/schema";
import { createSubaccount, type AsaasSubaccountInput } from "@shared/lib/asaas-client";
import { encrypt } from "@shared/lib/crypto-vault";
import { isMarketplaceSplitEnabled } from "./flags";

/**
 * J45 — Onboarding da subconta Asaas do empreiteiro (papel recebedor).
 * Cria a subconta via /accounts, cifra a apiKey em repouso e persiste o
 * walletId (campo que entra no split das obras). Idempotente por user_id.
 */

/** Dados de recebimento informados pelo empreiteiro na UI. */
export interface DadosRecebimento {
  tipoConta: "PIX" | "TED";
  // PIX
  pixChave?: string;
  pixTipo?: string;
  // TED
  bancoCodigo?: string;
  agencia?: string;
  conta?: string;
  contaDigito?: string;
  contaTipo?: string;
  // Titular + dados exigidos pelo Asaas na abertura
  titularNome?: string;
  titularCpfCnpj?: string;
  mobilePhone?: string;
  incomeValue?: number;
}

export type SubcontaResult =
  | { ok: true; subconta: PublicSubconta }
  | { ok: false; code: "SPLIT_DESABILITADO" }
  | { ok: false; code: "PERFIL_INCOMPLETO"; detail: string }
  | { ok: false; code: "INTERNAL_ERROR"; detail: string };

/** Projeção segura da subconta para a UI — NUNCA inclui a apiKey cifrada. */
export interface PublicSubconta {
  onboardingStatus: AsaasSubconta["onboardingStatus"];
  kycStatus: string | null;
  walletId: string | null;
  tipoConta: string | null;
  pixChave: string | null;
  pixTipo: string | null;
  bancoCodigo: string | null;
  agencia: string | null;
  conta: string | null;
  contaDigito: string | null;
  contaTipo: string | null;
  titularNome: string | null;
}

function toPublic(row: AsaasSubconta): PublicSubconta {
  return {
    onboardingStatus: row.onboardingStatus,
    kycStatus: row.kycStatus,
    walletId: row.walletId,
    tipoConta: row.tipoConta,
    pixChave: row.pixChave,
    pixTipo: row.pixTipo,
    bancoCodigo: row.bancoCodigo,
    agencia: row.agencia,
    conta: row.conta,
    contaDigito: row.contaDigito,
    contaTipo: row.contaTipo,
    titularNome: row.titularNome,
  };
}

/** Status atual da subconta do empreiteiro (null se ainda não configurou). */
export async function getSubconta(userId: string): Promise<PublicSubconta | null> {
  const [row] = await db.select().from(asaasSubcontas).where(eq(asaasSubcontas.userId, userId)).limit(1);
  return row ? toPublic(row) : null;
}

export async function criarOuAtualizarSubconta(
  userId: string,
  dados: DadosRecebimento,
): Promise<SubcontaResult> {
  try {
    if (!isMarketplaceSplitEnabled()) {
      return { ok: false, code: "SPLIT_DESABILITADO" };
    }

    // Exige CPF/CNPJ no perfil (papel recebedor precisa de documento fiscal).
    const [userRow] = await db
      .select({ name: users.name, email: users.email, cpfCnpj: users.cpfCnpj })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const cpfCnpj = userRow?.cpfCnpj ?? undefined;
    if (!cpfCnpj) {
      return {
        ok: false,
        code: "PERFIL_INCOMPLETO",
        detail: "Informe seu CPF/CNPJ antes de configurar o recebimento.",
      };
    }

    // Dados de endereço mínimos exigidos pelo Asaas: reaproveita a empreiteira.
    const [emp] = await db
      .select({ cep: empreiteiras.cep, endereco: empreiteiras.endereco, cidade: empreiteiras.cidade })
      .from(empreiteiras)
      .where(eq(empreiteiras.userId, userId))
      .limit(1);

    // Já existe subconta? (idempotência: 1 por user). Se sim, atualizamos os
    // dados de recebimento locais sem recriar a subconta no Asaas.
    const [existing] = await db
      .select()
      .from(asaasSubcontas)
      .where(eq(asaasSubcontas.userId, userId))
      .limit(1);

    const dadosLocais = {
      tipoConta: dados.tipoConta,
      pixChave: dados.pixChave ?? null,
      pixTipo: dados.pixTipo ?? null,
      bancoCodigo: dados.bancoCodigo ?? null,
      agencia: dados.agencia ?? null,
      conta: dados.conta ?? null,
      contaDigito: dados.contaDigito ?? null,
      contaTipo: dados.contaTipo ?? null,
      titularNome: dados.titularNome ?? userRow?.name ?? null,
      titularCpfCnpj: dados.titularCpfCnpj ?? cpfCnpj,
      updatedAt: new Date(),
    };

    if (existing?.asaasAccountId) {
      // Subconta já criada no Asaas — só atualiza dados locais de recebimento.
      const [updated] = await db
        .update(asaasSubcontas)
        .set(dadosLocais)
        .where(eq(asaasSubcontas.userId, userId))
        .returning();
      return { ok: true, subconta: toPublic(updated) };
    }

    // Cria a subconta no Asaas.
    const input: AsaasSubaccountInput = {
      name: userRow?.name ?? "Empreiteiro",
      email: userRow?.email ?? "",
      cpfCnpj,
      mobilePhone: dados.mobilePhone,
      incomeValue: dados.incomeValue,
      address: emp?.endereco ?? undefined,
      province: emp?.cidade ?? undefined,
      postalCode: emp?.cep ?? undefined,
    };
    const sub = await createSubaccount(input);

    // Cifra a apiKey em repouso (NUNCA persistir texto puro). Só cifra se o
    // Asaas devolveu apiKey (algumas respostas de reenvio não a incluem).
    const apiKeyEnc = sub.apiKey ? encrypt(sub.apiKey) : null;

    const [saved] = await db
      .insert(asaasSubcontas)
      .values({
        userId,
        asaasAccountId: sub.id,
        walletId: sub.walletId,
        asaasApiKeyEnc: apiKeyEnc,
        onboardingStatus: "aguardando_kyc",
        kycStatus: sub.status ?? null,
        ...dadosLocais,
      })
      .onConflictDoUpdate({
        target: asaasSubcontas.userId,
        set: {
          asaasAccountId: sub.id,
          walletId: sub.walletId,
          ...(apiKeyEnc ? { asaasApiKeyEnc: apiKeyEnc } : {}),
          onboardingStatus: "aguardando_kyc",
          kycStatus: sub.status ?? null,
          ...dadosLocais,
        },
      })
      .returning();

    return { ok: true, subconta: toPublic(saved) };
  } catch (err) {
    console.error("[subconta-service] erro inesperado:", err);
    return { ok: false, code: "INTERNAL_ERROR", detail: String(err) };
  }
}
