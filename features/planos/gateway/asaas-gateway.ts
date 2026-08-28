/**
 * Adapter ASAAS — J14.
 *
 * Implementa `PaymentGateway` usando o checkout hospedado do ASAS (redirect).
 * O Checkout recorrente atual do Asaas usa cartão de crédito. A cobrança é
 * gerenciada pelo Asaas; a ativação ocorre via webhook de pagamento confirmado.
 *
 * Env vars obrigatórias (server-side):
 *   ASAAS_API_KEY        — chave de API (prefixo $aact_hmlg_ em sandbox)
 *   ASAAS_ENVIRONMENT    — "sandbox" | "production" (default: sandbox)
 *
 * Segurança: webhooks verificados via IP whitelist configurável.
 *   ASAAS_WEBHOOK_IPS    — lista de IPs autorizados separados por vírgula
 *                          (ex: "54.94.97.128,18.228.149.104"). Se não
 *                          configurada, apenas um aviso é emitido (sandbox).
 *   TRUST_PROXY_HEADERS  — se "1", lê X-Forwarded-For para extrair o IP real.
 */

import { createHash, timingSafeEqual } from "node:crypto";
import {
  asaasRequest,
  getAsaasCheckoutUrl,
  type AsaasCheckout,
  type AsaasCustomer,
  type AsaasCustomerList,
  type AsaasPayment,
  type AsaasSubscription,
} from "@shared/lib/asaas-client";
import type {
  CheckoutInput,
  CheckoutResult,
  GatewayPaymentStatus,
  NormalizedWebhookEvent,
  PaymentGateway,
} from "./payment-gateway";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Formato do externalReference: permite recuperar userId/planoId/ciclo do webhook. */
function buildExternalRef(userId: string, planoId: string, ciclo: string): string {
  // Separador "|" é seguro — UUIDs só contêm hex + hifens, planoIds não contêm "|"
  return `xconstrucao|${userId}|${planoId}|${ciclo}`;
}

export function parseExternalRef(ref: string): { userId: string; planoId: string; ciclo: string } | null {
  const parts = ref.split("|");
  if (parts.length !== 4 || parts[0] !== "xconstrucao") return null;
  return { userId: parts[1], planoId: parts[2], ciclo: parts[3] };
}

/** Busca customer ASAS por email; cria se não existir. Atualiza cpfCnpj se já
 *  existe mas estava faltando — evita HTTP 400 em cobranças recorrentes.
 *  Exportado para provisionamento proativo do customer no cadastro (J44). */
export async function findOrCreateCustomer(
  email: string,
  name: string,
  cpfCnpj?: string,
): Promise<AsaasCustomer> {
  // Tenta encontrar por email
  const list = await asaasRequest<AsaasCustomerList>("GET", `/customers?email=${encodeURIComponent(email)}&limit=1`);
  if (list.data?.length > 0) {
    const existing = list.data[0];
    // Se o customer existente não tem cpfCnpj mas agora temos, atualiza via PUT.
    if (cpfCnpj && !existing.cpfCnpj) {
      try {
        return await asaasRequest<AsaasCustomer>("PUT", `/customers/${existing.id}`, {
          name,
          email,
          cpfCnpj,
        });
      } catch (err) {
        console.warn(`[asaas] falha ao atualizar cpfCnpj do customer ${existing.id}:`, err);
      }
    }
    return existing;
  }

  // Cria novo customer
  return asaasRequest<AsaasCustomer>("POST", "/customers", {
    name,
    email,
    ...(cpfCnpj ? { cpfCnpj } : {}),
    notificationDisabled: false,
  });
}

const CYCLE_MAP: Record<string, string> = {
  mensal: "MONTHLY",
  anual: "YEARLY",
};

/** O Asaas exige data/hora no formato YYYY-MM-DD HH:mm:ss para a primeira cobrança. */
function nextDueDate(): string {
  return new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ");
}

// ── Mapeamento de eventos ────────────────────────────────────────────────────

// Apenas eventos explicitamente mapeados são processados — todos os outros
// são tratados como "ignored" pelo fallback `?? "ignored"` em parseWebhook.
// SUBSCRIPTION_CREATED NÃO está aqui: a ativação da assinatura ocorre SOMENTE
// após confirmação de pagamento (PAYMENT_CONFIRMED/RECEIVED), nunca na criação
// do contrato. Isso evita ativação prematura antes de cobrança confirmada.
const EVENT_TYPE_MAP: Record<string, NormalizedWebhookEvent["type"]> = {
  PAYMENT_CONFIRMED: "payment_succeeded",
  PAYMENT_RECEIVED: "payment_succeeded",
  PAYMENT_OVERDUE: "payment_failed",
  PAYMENT_DELETED: "payment_failed",
  SUBSCRIPTION_DELETED: "subscription_canceled",
};

// ── AsaasGateway ─────────────────────────────────────────────────────────────

export class AsaasGateway implements PaymentGateway {
  readonly provider = "asaas";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://xconstrucao.com.br";

    const externalRef = buildExternalRef(input.userId, input.planoId, input.ciclo);

    const tierLabel: Record<string, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
    const cicloLabel: Record<string, string> = { mensal: "Mensal", anual: "Anual" };
    const itemName =
      input.planoNome ??
      `Plano XConstrução ${tierLabel[input.tier] ?? input.tier} – ${cicloLabel[input.ciclo] ?? input.ciclo}`;

    const checkout = await asaasRequest<AsaasCheckout>("POST", "/checkouts", {
      billingTypes: ["CREDIT_CARD"],
      chargeTypes: ["RECURRENT"],
      minutesToExpire: 60,
      items: [{ name: itemName, description: itemName, value: input.valor, quantity: 1 }],
      externalReference: externalRef,
      subscription: {
        cycle: CYCLE_MAP[input.ciclo] ?? "MONTHLY",
        nextDueDate: nextDueDate(),
      },
      callback: {
        successUrl: input.successUrl ?? `${baseUrl}/planos/sucesso`,
        cancelUrl: input.cancelUrl ?? `${baseUrl}/planos`,
        expiredUrl: input.cancelUrl ?? `${baseUrl}/planos`,
      },
    });

    // NÃO retornamos gatewaySubscriptionId aqui: `checkout.id` é o ID de um
    // /checkouts, NÃO de uma /subscriptions. A subscription só é criada pelo
    // ASAAS APÓS o pagamento, e seu ID real chega no webhook via
    // `payment.subscription` (parseWebhook) — é ele que é persistido em
    // `assinaturas.gatewaySubscriptionId`. Devolver o checkout.id aqui faria
    // cancelSubscription/checkPaymentStatus baterem em /subscriptions/{id}
    // inexistente (404). O checkout.id é usado apenas para rastreio via log.
    //
    // O contrato atual permite omitir customer/customerData. Assim, o pagador
    // completa os dados exigidos na página hospedada e o customer criado pelo
    // Asaas chega no webhook junto com a externalReference.
    console.info(`[asaas] checkout criado: checkoutId=${checkout.id}`);
    return {
      kind: "redirect",
      url: checkout.url ?? getAsaasCheckoutUrl(checkout.id),
    };
  }

  async cancelSubscription(gatewaySubscriptionId: string | null): Promise<void> {
    if (!gatewaySubscriptionId) return;
    try {
      await asaasRequest<void>("DELETE", `/subscriptions/${gatewaySubscriptionId}`);
    } catch (err: unknown) {
      // Ignora 404 (já cancelada no ASAS) mas propaga outros erros
      if (err instanceof Error && err.message.includes("HTTP 404")) return;
      throw err;
    }
  }

  async checkPaymentStatus(gatewaySubscriptionId: string | null): Promise<GatewayPaymentStatus> {
    if (!gatewaySubscriptionId) return "unknown";
    try {
      // Primeiro: verifica o status da assinatura no gateway.
      const sub = await asaasRequest<AsaasSubscription>("GET", `/subscriptions/${gatewaySubscriptionId}`);
      if (sub.status === "ACTIVE") return "paid";
      if (sub.status === "EXPIRED" || sub.status === "INACTIVE") return "unpaid";

      // Fallback: lista os últimos pagamentos e verifica se há algum confirmado.
      const payments = await asaasRequest<{ data: AsaasPayment[]; totalCount: number }>(
        "GET",
        `/subscriptions/${gatewaySubscriptionId}/payments?limit=5`,
      );
      const hasPaid = payments.data?.some(
        (p) => p.status === "CONFIRMED" || p.status === "RECEIVED",
      );
      if (hasPaid) return "paid";
      if (payments.data && payments.data.length > 0) return "unpaid";
      return "unknown";
    } catch (err) {
      console.warn("[asaas] checkPaymentStatus falhou — retornando unknown:", err);
      return "unknown";
    }
  }

  async parseWebhook(rawBody: string, headers: Record<string, string> = {}, clientIp?: string): Promise<NormalizedWebhookEvent> {
    // ── Auth criptográfica: token do webhook (asaas-access-token) ────────────
    // Auth PRIMÁRIA, independente de IP/proxy. O token é definido no painel Asaas
    // (Integrações → Webhooks) e enviado no header `asaas-access-token`.
    // Comparação em tempo constante (timingSafeEqual sobre SHA-256 dos valores,
    // para não vazar comprimento). Este é o controle que impede um POST forjado
    // de confirmar pagamento de obra / aprovar subconta.
    const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN ?? "";
    const allowedIps = (process.env.ASAAS_WEBHOOK_IPS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (expectedToken) {
      // Header vem em minúsculas (normalizado pelo route). Aceita algumas grafias.
      const received =
        headers["asaas-access-token"] ?? headers["Asaas-Access-Token"] ?? headers["access_token"] ?? "";
      const a = createHash("sha256").update(received).digest();
      const b = createHash("sha256").update(expectedToken).digest();
      if (!timingSafeEqual(a, b)) {
        console.warn("[asaas] webhook rejeitado: token inválido");
        throw new Error("[asaas] webhook token inválido");
      }
    } else if (allowedIps.length === 0 && process.env.NODE_ENV === "production") {
      // FAIL-CLOSED: sem token E sem IP whitelist, qualquer POST forjado
      // confirmaria assinatura ou pedido de anúncio. Recusar em produção.
      //
      // O gate era `MARKETPLACE_SPLIT=on`, cujo default é `off` — então na
      // configuração real da plataforma o fail-closed nunca disparava, mesmo
      // com pagamentos de plano (J11) e de anúncio (J31) já ativos, que não
      // dependem do split. Agora vale para qualquer aplicação publicada.
      //
      // Fora de produção segue permissivo de propósito: o simulador de
      // webhook (app/api/test/webhooks/asaas) precisa disso em dev.
      console.error(
        "[asaas] webhook recusado: em produção é obrigatório configurar " +
          "ASAAS_WEBHOOK_TOKEN (recomendado) ou ASAAS_WEBHOOK_IPS.",
      );
      throw new Error("[asaas] webhook sem autenticação configurada");
    }

    // ── IP whitelist (defesa secundária) ─────────────────────────────────────
    // `clientIp` é resolvido pelo route handler via `getClientIp(request)` que
    // já aplica corretamente a política TRUST_PROXY_HEADERS. Não lemos headers
    // de IP aqui — o chamador poderia forjar X-Real-IP ou X-Forwarded-For.
    if (allowedIps.length === 0) {
      if (!expectedToken) {
        console.warn(
          "[asaas] ASAAS_WEBHOOK_IPS/TOKEN não configurados — aceitando webhook sem verificação (modo sandbox). " +
            "Configure ASAAS_WEBHOOK_TOKEN em produção."
        );
      }
    } else {
      const resolvedIp = clientIp ?? "unknown";

      if (!allowedIps.includes(resolvedIp)) {
        console.warn(`[asaas] webhook rejeitado: IP "${resolvedIp}" não está na whitelist`);
        throw new Error(`[asaas] IP não autorizado: ${resolvedIp}`);
      }
      console.info(`[asaas] webhook aceito de IP autorizado: ${resolvedIp}`);
    }
    // ───────────────────────────────────────────────────────────────────────


    let body: Record<string, unknown> = {};
    try {
      body = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      throw new Error("[asaas] webhook body inválido (não é JSON)");
    }

    const event = (body.event as string) ?? "";
    const payment = (body.payment as Record<string, unknown>) ?? {};
    const subscription = (body.subscription as Record<string, unknown>) ?? {};

    // J46 — eventos de status de subconta (KYC). Formato Asaas:
    //   { event: "ACCOUNT_STATUS_*", id: "<evtId>", account: { id }, accountStatus: {...} }
    // A subconta só fica APTA a receber na aprovação GERAL; as demais etapas
    // (bank/commercial/document) são intermediárias → segue aguardando.
    if (event.startsWith("ACCOUNT_STATUS_")) {
      const account = (body.account as Record<string, unknown>) ?? {};
      const accountId = (account.id as string) ?? "";
      const evtUniqueId = (body.id as string) ?? "";
      const eventId = `${event}:${accountId || evtUniqueId || `asaas_conta`}`;

      let accountStatus: NormalizedWebhookEvent["accountStatus"];
      if (event === "ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED") accountStatus = "approved";
      else if (event.endsWith("_REJECTED")) accountStatus = "rejected";
      else accountStatus = "pending";

      console.info(`[asaas] webhook conta event="${event}" accountId="${accountId}" status="${accountStatus}"`);

      return {
        eventId,
        type: "account_status_changed",
        accountId: accountId || undefined,
        accountStatus,
        raw: body,
      };
    }

    // ID do evento: preferir payment.id, depois subscription.id.
    // IMPORTANTE: o eventId DEVE incluir o tipo do evento para evitar falsa
    // deduplicação entre eventos distintos no mesmo recurso. Ex: PAYMENT_OVERDUE
    // e PAYMENT_CONFIRMED podem chegar para o mesmo payment.id — sem o prefixo
    // do evento, o segundo seria silenciosamente descartado como duplicata.
    const paymentId = (payment.id as string) ?? "";
    const subscriptionId =
      (payment.subscription as string) ?? (subscription.id as string) ?? "";
    const resourceId = paymentId || subscriptionId || `asaas_${Date.now()}`;
    const eventId = `${event}:${resourceId}`;

    // externalReference: permite reconectar o evento ao usuário/plano
    const externalReference =
      (payment.externalReference as string) ??
      (subscription.externalReference as string) ??
      undefined;

    const normalizedType: NormalizedWebhookEvent["type"] = EVENT_TYPE_MAP[event] ?? "ignored";

    console.info(`[asaas] webhook event="${event}" mapped="${normalizedType}" paymentId="${paymentId}" subId="${subscriptionId}"`);

    return {
      eventId,
      type: normalizedType,
      gatewaySubscriptionId: subscriptionId || undefined,
      gatewayCustomerId: (payment.customer as string) ?? (subscription.customer as string) ?? undefined,
      externalReference,
      valor: typeof payment.value === "number" ? payment.value : undefined,
      raw: body,
    };
  }
}
