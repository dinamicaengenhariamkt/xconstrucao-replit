/**
 * Adapter ASAAS — J14.
 *
 * Implementa `PaymentGateway` usando o checkout hospedado do ASAS (redirect).
 * PIX, Boleto e Cartão de crédito disponíveis. Cobrança recorrente gerenciada
 * pelo ASAS; ativação da assinatura via webhook (PAYMENT_CONFIRMED/RECEIVED).
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

import {
  asaasRequest,
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
export async function findOrCreateCustomer(email: string, name: string, cpfCnpj?: string): Promise<AsaasCustomer> {
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
    const email = input.userEmail ?? `user_${input.userId}@xconstrucao.placeholder`;
    const name = input.userName ?? `Usuário ${input.userId.slice(0, 8)}`;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://xconstrucao.com.br";

    // J44 — usa o customer já provisionado (users.asaasCustomerId) quando existir,
    // evitando o lookup por email a cada checkout. Fallback lazy se ausente.
    const customerId = input.userAsaasCustomerId
      ? input.userAsaasCustomerId
      : (await findOrCreateCustomer(email, name, input.userCpfCnpj)).id;
    const externalRef = buildExternalRef(input.userId, input.planoId, input.ciclo);

    const tierLabel: Record<string, string> = { free: "Free", pro: "Pro", enterprise: "Enterprise" };
    const cicloLabel: Record<string, string> = { mensal: "Mensal", anual: "Anual" };
    const itemName =
      input.planoNome ??
      `Plano XConstrução ${tierLabel[input.tier] ?? input.tier} – ${cicloLabel[input.ciclo] ?? input.ciclo}`;

    const checkout = await asaasRequest<AsaasCheckout>("POST", "/checkouts", {
      billingType: "UNDEFINED",
      chargeType: "RECURRENT",
      cycle: CYCLE_MAP[input.ciclo] ?? "MONTHLY",
      items: [{ name: itemName, value: input.valor, quantity: 1 }],
      externalReference: externalRef,
      customer: customerId,
      callback: {
        successUrl: input.successUrl ?? `${baseUrl}/planos/sucesso`,
        cancelUrl: input.cancelUrl ?? `${baseUrl}/planos`,
      },
    });

    // NÃO retornamos gatewaySubscriptionId aqui: `checkout.id` é o ID de um
    // /checkouts, NÃO de uma /subscriptions. A subscription só é criada pelo
    // ASAAS APÓS o pagamento, e seu ID real chega no webhook via
    // `payment.subscription` (parseWebhook) — é ele que é persistido em
    // `assinaturas.gatewaySubscriptionId`. Devolver o checkout.id aqui faria
    // cancelSubscription/checkPaymentStatus baterem em /subscriptions/{id}
    // inexistente (404). O checkout.id é usado apenas para rastreio via log.
    console.info(`[asaas] checkout criado: checkoutId=${checkout.id} customer=${customerId}`);
    return {
      kind: "redirect",
      url: checkout.url,
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

  async parseWebhook(rawBody: string, _headers: Record<string, string> = {}, clientIp?: string): Promise<NormalizedWebhookEvent> {
    // ── IP whitelist ────────────────────────────────────────────────────────
    // `clientIp` é resolvido pelo route handler via `getClientIp(request)` que
    // já aplica corretamente a política TRUST_PROXY_HEADERS. Não lemos headers
    // de IP aqui — o chamador poderia forjar X-Real-IP ou X-Forwarded-For.
    const allowedIps = (process.env.ASAAS_WEBHOOK_IPS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (allowedIps.length === 0) {
      console.warn(
        "[asaas] ASAAS_WEBHOOK_IPS não configurado — aceitando webhook sem verificação de IP (modo sandbox). " +
          "Configure esta env var em produção com os IPs oficiais do ASAS."
      );
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
