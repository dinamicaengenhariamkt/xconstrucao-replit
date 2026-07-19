import type {
  CheckoutInput,
  CheckoutResult,
  GatewayPaymentStatus,
  NormalizedWebhookEvent,
  PaymentGateway,
} from "./payment-gateway";

/**
 * Adapter MANUAL (stub ativo) — J11.
 *
 * NÃO faz cobrança real. Ativa a assinatura direto no banco (o service trata a
 * persistência). É o adapter padrão enquanto nenhum gateway real foi escolhido,
 * permitindo testar o fluxo de assinatura ponta-a-ponta (checkout → ativa →
 * gating → entrada no caixa) sem dinheiro de verdade.
 *
 * Quando um gateway real for plugado (J14), basta criar outro adapter e mudar a
 * env var `PAYMENT_GATEWAY`. Service/rotas/schema permanecem intocados.
 *
 * ## Modo pendente (`input.pendingMode = true`)
 * Retorna `kind:"redirect"` em vez de ativar imediatamente. Permite testar o
 * ciclo completo checkout → POST /api/webhooks/gateway → ativa em E2E, sem
 * chamar um gateway real. O externalReference é embutido na URL de redirect
 * para que o teste o extraia e o inclua no payload do webhook.
 *
 * ## Formato ASAAS em parseWebhook
 * Além do formato interno `{ type, eventId }`, aceita o formato canônico ASAAS:
 *   { "event": "PAYMENT_RECEIVED", "payment": { "id", "subscription",
 *     "externalReference", "value" } }
 * Isso permite que testes E2E chamem POST /api/webhooks/gateway com um payload
 * idêntico ao que o ASAAS enviaria em produção.
 */
export class ManualGateway implements PaymentGateway {
  readonly provider = "manual";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const ts = Date.now();
    const gwSubId = `manual_sub_${input.userId}_${input.planoId}_${ts}`;

    if (input.pendingMode) {
      // Modo pendente: simula gateway hospedado que redireciona para pagar.
      // O externalReference segue o contrato "xconstrucao|userId|planoId|ciclo"
      // e é embutido na URL para que o chamador o use no webhook de confirmação.
      const extRef = `xconstrucao|${input.userId}|${input.planoId}|${input.ciclo}`;
      const url =
        `/planos/aguardando` +
        `?ext=${encodeURIComponent(extRef)}` +
        `&gwSub=${encodeURIComponent(gwSubId)}`;
      return { kind: "redirect", url, gatewaySubscriptionId: gwSubId };
    }

    // Modo direto (padrão): ativa imediatamente, sem cobrança.
    // Sufixo de timestamp garante que o mesmo user+plano pode ser re-assinado
    // após cancelamento sem violar o unique constraint de assinaturaEventos.
    return {
      kind: "activated",
      gatewayCustomerId: `manual_cus_${input.userId}`,
      gatewaySubscriptionId: gwSubId,
    };
  }

  async cancelSubscription(_gatewaySubscriptionId: string | null): Promise<void> {
    // No-op: não há assinatura remota para cancelar.
  }

  async parseWebhook(rawBody: string, _headers: Record<string, string> = {}, _clientIp?: string): Promise<NormalizedWebhookEvent> {
    let parsed: Record<string, unknown> = {};
    try {
      parsed = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      parsed = {};
    }

    // ── Formato ASAAS (contrato de produção) ────────────────────────────────
    // Payload canônico: { "event": "PAYMENT_RECEIVED", "payment": { ... } }
    // Permite que testes E2E chamem POST /api/webhooks/gateway com o mesmo
    // payload que o ASAAS enviaria em produção.
    const asaasEventMap: Record<string, NormalizedWebhookEvent["type"]> = {
      PAYMENT_CONFIRMED: "payment_succeeded",
      PAYMENT_RECEIVED: "payment_succeeded",
      PAYMENT_OVERDUE: "payment_failed",
      PAYMENT_DELETED: "payment_failed",
      SUBSCRIPTION_CANCELED: "subscription_canceled",
      SUBSCRIPTION_INACTIVATED: "subscription_canceled",
      SUBSCRIPTION_ACTIVATED: "subscription_activated",
    };

    if (typeof parsed.event === "string" && parsed.event in asaasEventMap) {
      const payment = (parsed.payment ?? {}) as Record<string, unknown>;
      const subscription = typeof payment.subscription === "string" ? payment.subscription : undefined;
      const eventId =
        typeof payment.id === "string" ? `asaas_${payment.id}` : `manual_asaas_${Date.now()}`;
      const extRef =
        typeof payment.externalReference === "string" ? payment.externalReference : undefined;
      const valor =
        typeof payment.value === "number" ? payment.value :
        typeof payment.value === "string" ? Number(payment.value) : undefined;

      return {
        eventId,
        type: asaasEventMap[parsed.event],
        gatewaySubscriptionId: subscription,
        externalReference: extRef,
        valor: valor !== undefined && !Number.isNaN(valor) ? valor : undefined,
        raw: parsed,
      };
    }

    // ── Formato interno (compatibilidade com test shortcut e seeds) ──────────
    const eventId = typeof parsed.eventId === "string" ? parsed.eventId : `manual_evt_${Date.now()}`;
    const type = (parsed.type as NormalizedWebhookEvent["type"]) ?? "ignored";
    const extRef = typeof parsed.externalReference === "string" ? parsed.externalReference : undefined;
    const valor =
      typeof parsed.valor === "number" ? parsed.valor :
      typeof parsed.valor === "string" ? Number(parsed.valor) : undefined;

    return {
      eventId,
      type,
      gatewaySubscriptionId: typeof parsed.gatewaySubscriptionId === "string" ? parsed.gatewaySubscriptionId : undefined,
      gatewayCustomerId: typeof parsed.gatewayCustomerId === "string" ? parsed.gatewayCustomerId : undefined,
      externalReference: extRef,
      valor: valor !== undefined && !Number.isNaN(valor) ? valor : undefined,
      raw: parsed,
    };
  }

  async checkPaymentStatus(_gatewaySubscriptionId: string | null): Promise<GatewayPaymentStatus> {
    // O adapter manual não tem gateway real para consultar. Retorna "unknown" para
    // que o job de downgrade adote o comportamento conservador (expira a assinatura).
    return "unknown";
  }
}
