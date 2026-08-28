/**
 * Cliente HTTP base para a API do ASAS — server-side ONLY.
 * Nunca importar em componentes 'use client' ou no browser.
 *
 * Docs: https://docs.asaas.com
 */

const BASE_URLS: Record<string, string> = {
  sandbox: "https://api-sandbox.asaas.com/v3",
  production: "https://api.asaas.com/v3",
};

/**
 * Resolve a base URL a partir de `ASAAS_ENVIRONMENT`.
 *
 * Note que a escolha é INDEPENDENTE de `NODE_ENV`: rodar sandbox no ambiente
 * publicado é um cenário legítimo (clientes testando em produção sem cobrança
 * real). Quem avisa o usuário disso é o banner de `getAsaasEnvironment()`.
 *
 * Um valor fora de `sandbox|production` é erro, não fallback. Antes,
 * `ASAAS_ENVIRONMENT=prod` caía silenciosamente em sandbox — a plataforma
 * pareceria em produção enquanto cobrava em ambiente de testes.
 */
function getBaseUrl(): string {
  const env = process.env.ASAAS_ENVIRONMENT ?? "sandbox";
  const baseUrl = BASE_URLS[env];
  if (!baseUrl) {
    throw new Error(
      `[asaas] ASAAS_ENVIRONMENT inválido: "${env}". ` +
        `Valores aceitos: ${Object.keys(BASE_URLS).join(" | ")} (minúsculas).`,
    );
  }
  return baseUrl;
}

/** Ambientes válidos do Asaas. */
export type AsaasEnvironment = "sandbox" | "production";

/**
 * Ambiente Asaas em uso. Exportado para a UI decidir se mostra o aviso de
 * "pagamentos simulados" e para o log de boot. Valida da mesma forma que
 * `getBaseUrl()`, então uma config errada falha cedo e de forma visível.
 */
export function getAsaasEnvironment(): AsaasEnvironment {
  const env = process.env.ASAAS_ENVIRONMENT ?? "sandbox";
  if (env !== "sandbox" && env !== "production") {
    throw new Error(
      `[asaas] ASAAS_ENVIRONMENT inválido: "${env}". Valores aceitos: sandbox | production.`,
    );
  }
  return env;
}

/** `true` quando os pagamentos são simulados (sandbox). */
export function isAsaasSandbox(): boolean {
  return getAsaasEnvironment() === "sandbox";
}

/** URL hospedada do Checkout a partir do ID retornado pelo Asaas. */
export function getAsaasCheckoutUrl(checkoutId: string): string {
  const host = isAsaasSandbox() ? "https://sandbox.asaas.com" : "https://asaas.com";
  return `${host}/checkoutSession/show?id=${encodeURIComponent(checkoutId)}`;
}

function getApiKey(): string {
  const key = process.env.ASAAS_API_KEY;
  if (!key) throw new Error("[asaas] ASAAS_API_KEY não configurado");
  return key;
}

export async function asaasRequest<T>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
  // J43 — operações de subconta (saldo/saque) exigem a apiKey DA SUBCONTA no
  // header `access_token`, não a master key. Passe-a aqui para sobrescrever.
  // Nunca logar este valor. Ausente → usa a master key (getApiKey()).
  apiKeyOverride?: string,
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      access_token: apiKeyOverride ?? getApiKey(),
      "Content-Type": "application/json",
      "User-Agent": "XConstrucao/1.0 (Node.js; +https://xconstrucao.com.br)",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const err = (await res.json()) as { errors?: { description?: string }[] };
      if (err.errors?.[0]?.description) message = err.errors[0].description;
    } catch {
      // ignore parse error, use statusText
    }
    throw new Error(`[asaas] HTTP ${res.status}: ${message}`);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Tipos de resposta ASAS frequentemente usados ─────────────────────────────

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
}

export interface AsaasCustomerList {
  data: AsaasCustomer[];
  totalCount: number;
}

export interface AsaasCheckout {
  id: string;
  /** Presente em versões anteriores da API; no contrato atual o link é montado pelo ID. */
  url?: string;
  status?: string;
  split?: AsaasSplit[];
}

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  externalReference?: string;
  value: number;
  status: string;
  billingType: string;
  split?: AsaasSplit[];
  /** Página de pagamento hospedada da cobrança (PIX/Boleto/Cartão) — J47. */
  invoiceUrl?: string;
  /** Vencimento da cobrança (YYYY-MM-DD). */
  dueDate?: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  externalReference?: string;
  value: number;
  status: string;
  cycle?: string;
}

// ── J43 — Subcontas, split, saldo e transferência (marketplace/recebedor) ─────

/** Regra de split de um pagamento: destina parte ao walletId da subconta. */
export interface AsaasSplit {
  walletId: string;
  /** Percentual do valor total (0–100). Use este OU fixedValue, não ambos. */
  percentualValue?: number;
  /** Valor fixo em reais. Use este OU percentualValue. */
  fixedValue?: number;
}

/** Subconta Asaas (empreiteiro recebedor). `apiKey` só volta na criação. */
export interface AsaasSubaccount {
  id: string;
  walletId: string;
  apiKey?: string;
  accountNumber?: { agency?: string; account?: string; accountDigit?: string };
  /** Status de KYC/onboarding retornado pelo Asaas. */
  status?: string;
  /** URL para o titular completar a documentação (KYC pendente). */
  onboardingUrl?: string;
}

export interface AsaasSubaccountList {
  data: AsaasSubaccount[];
  totalCount: number;
}

export interface AsaasSubaccountInput {
  name: string;
  email: string;
  cpfCnpj: string;
  /** MEI | LIMITED | INDIVIDUAL | ASSOCIATION (tipo de pessoa/empresa). */
  companyType?: string;
  mobilePhone?: string;
  /** Renda/faturamento mensal — exigido pelo Asaas para abertura. */
  incomeValue?: number;
  address?: string;
  addressNumber?: string;
  province?: string;
  postalCode?: string;
}

export interface AsaasBalance {
  balance: number;
}

export interface AsaasTransfer {
  id: string;
  value: number;
  status: string;
}

export interface AsaasTransferInput {
  value: number;
  /** Saque PIX: chave de destino. */
  pixAddressKey?: string;
  pixAddressKeyType?: string;
  /** Saque TED: dados bancários (alternativa ao PIX). */
  bankAccount?: {
    bank: { code: string };
    accountName?: string;
    ownerName: string;
    cpfCnpj: string;
    agency: string;
    account: string;
    accountDigit: string;
    bankAccountType?: string;
  };
}

/** Cria a subconta Asaas do empreiteiro (POST /accounts). */
export function createSubaccount(input: AsaasSubaccountInput): Promise<AsaasSubaccount> {
  return asaasRequest<AsaasSubaccount>("POST", "/accounts", input);
}

/**
 * Consulta subconta por accountId (GET /accounts/{id}) ou por cpfCnpj
 * (GET /accounts?cpfCnpj=). Usado no webhook de KYC (J46) e para reidratar status.
 */
export async function getSubaccount(accountIdOrCpfCnpj: string): Promise<AsaasSubaccount | null> {
  const digits = accountIdOrCpfCnpj.replace(/\D/g, "");
  // Heurística: 11 (CPF) ou 14 (CNPJ) dígitos → busca por cpfCnpj; senão, por id.
  if (digits.length === 11 || digits.length === 14) {
    const list = await asaasRequest<AsaasSubaccountList>(
      "GET",
      `/accounts?cpfCnpj=${encodeURIComponent(digits)}&limit=1`,
    );
    return list.data?.[0] ?? null;
  }
  return asaasRequest<AsaasSubaccount>("GET", `/accounts/${encodeURIComponent(accountIdOrCpfCnpj)}`);
}

export interface AsaasPaymentWithSplitInput {
  customer: string;
  billingType: string;
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  split: AsaasSplit[];
}

/**
 * Cria uma cobrança avulsa (DETACHED) com split (POST /payments). O split
 * destina `valorEmpreiteiro` ao walletId da subconta; o restante fica na
 * plataforma (comissão). Espelha o payload de createCheckout de assinatura.
 */
export function createPaymentWithSplit(input: AsaasPaymentWithSplitInput): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>("POST", "/payments", input);
}

/** Consulta uma cobrança por id (GET /payments/{id}) — usado na reconciliação (J50). */
export function getPayment(id: string): Promise<AsaasPayment> {
  return asaasRequest<AsaasPayment>("GET", `/payments/${encodeURIComponent(id)}`);
}

/** Saldo da subconta — usa a apiKey DA SUBCONTA (não a master). */
export function getBalance(apiKeyOverride: string): Promise<AsaasBalance> {
  return asaasRequest<AsaasBalance>("GET", "/finance/balance", undefined, apiKeyOverride);
}

/** Saque para o banco do empreiteiro — usa a apiKey DA SUBCONTA. */
export function requestTransfer(input: AsaasTransferInput, apiKeyOverride: string): Promise<AsaasTransfer> {
  return asaasRequest<AsaasTransfer>("POST", "/transfers", input, apiKeyOverride);
}
