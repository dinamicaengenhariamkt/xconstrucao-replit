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

function getBaseUrl(): string {
  const env = process.env.ASAAS_ENVIRONMENT ?? "sandbox";
  return BASE_URLS[env] ?? BASE_URLS.sandbox;
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
): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      access_token: getApiKey(),
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
  url: string;
  status: string;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  externalReference?: string;
  value: number;
  status: string;
  billingType: string;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  externalReference?: string;
  value: number;
  status: string;
  cycle?: string;
}
