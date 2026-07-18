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
 */
export class ManualGateway implements PaymentGateway {
  readonly provider = "manual";

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    // Sem cobrança: ativa imediatamente. Gera ids sintéticos rastreáveis.
    return {
      kind: "activated",
      gatewayCustomerId: `manual_cus_${input.userId}`,
      gatewaySubscriptionId: `manual_sub_${input.userId}_${input.planoId}`,
    };
  }

  async cancelSubscription(_gatewaySubscriptionId: string | null): Promise<void> {
    // No-op: não há assinatura remota para cancelar.
  }

  async parseWebhook(rawBody: string, _headers: Record<string, string> = {}, _clientIp?: string): Promise<NormalizedWebhookEvent> {
    // O adapter manual aceita um webhook simulado (ex: para testes/demonstração).
    // Adapters reais validam assinatura do payload aqui e lançam se inválida.
    let parsed: Record<string, unknown> = {};
    try {
      parsed = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {};
    } catch {
      parsed = {};
    }
    const eventId = typeof parsed.eventId === "string" ? parsed.eventId : `manual_evt_${Date.now()}`;
    const type = (parsed.type as NormalizedWebhookEvent["type"]) ?? "ignored";
    return {
      eventId,
      type,
      gatewaySubscriptionId: typeof parsed.gatewaySubscriptionId === "string" ? parsed.gatewaySubscriptionId : undefined,
      gatewayCustomerId: typeof parsed.gatewayCustomerId === "string" ? parsed.gatewayCustomerId : undefined,
      raw: parsed,
    };
  }

  async checkPaymentStatus(_gatewaySubscriptionId: string | null): Promise<GatewayPaymentStatus> {
    // O adapter manual não tem gateway real para consultar. Retorna "unknown" para
    // que o job de downgrade adote o comportamento conservador (expira a assinatura).
    return "unknown";
  }
}
