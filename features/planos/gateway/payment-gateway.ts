/**
 * Porta (interface) do gateway de pagamento — J11.
 *
 * Toda a J11 (schema, service, rotas) depende APENAS desta interface, nunca de
 * um provedor concreto. Trocar Stripe ↔ PayPal ↔ MercadoPago ↔ Asaas = escrever
 * um novo adapter que implemente `PaymentGateway` e apontar a env var
 * `PAYMENT_GATEWAY` para ele. Nada mais muda. Ver J14 (integração bloqueada).
 */

export interface CheckoutInput {
  userId: string;
  planoId: string;
  /** Tier do plano (free/pro/enterprise) — usado pelo adapter manual p/ ativar. */
  tier: "free" | "pro" | "enterprise";
  ciclo: "mensal" | "anual";
  valor: number;
  /** URLs de retorno (usadas por gateways com checkout hospedado). */
  successUrl?: string;
  cancelUrl?: string;
}

export type CheckoutResult =
  // Gateway hospedado: redireciona o usuário para pagar.
  | { kind: "redirect"; url: string; gatewaySubscriptionId?: string }
  // Ativação imediata (adapter manual / planos gratuitos): já confirma.
  | { kind: "activated"; gatewayCustomerId?: string; gatewaySubscriptionId?: string };

/** Evento normalizado a partir de um webhook do gateway. */
export interface NormalizedWebhookEvent {
  /** ID único do evento no gateway — chave de idempotência. */
  eventId: string;
  type: "subscription_activated" | "payment_succeeded" | "payment_failed" | "subscription_canceled" | "ignored";
  gatewaySubscriptionId?: string;
  gatewayCustomerId?: string;
  raw: Record<string, unknown>;
}

export interface PaymentGateway {
  readonly provider: string;
  /** Inicia o checkout de uma assinatura. */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Cancela a assinatura no gateway (no-op em adapters sem cobrança). */
  cancelSubscription(gatewaySubscriptionId: string | null): Promise<void>;
  /**
   * Valida e normaliza um webhook. `verifySignature` deve falhar (throw) se a
   * assinatura do payload for inválida no adapter real.
   */
  parseWebhook(rawBody: string, headers: Record<string, string>): Promise<NormalizedWebhookEvent>;
}
