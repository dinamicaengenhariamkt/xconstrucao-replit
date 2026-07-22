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
  /** Dados do usuário — necessários para criar/encontrar o customer no gateway. */
  userEmail?: string;
  userName?: string;
  /** CPF ou CNPJ do usuário (opcional; pode ser vazio em sandbox). */
  userCpfCnpj?: string;
  /**
   * ID do customer no gateway, já persistido (J44 — provisionamento proativo).
   * Quando presente, o adapter usa diretamente em vez de refazer o lookup por
   * email. Ausente → fallback lazy (findOrCreateCustomer).
   */
  userAsaasCustomerId?: string;
  /** Nome legível do plano — exibido como descrição do item no checkout hospedado (ex: ASAAS). */
  planoNome?: string;
  /**
   * Se `true`, força o adapter a retornar `kind:"redirect"` (pagamento pendente)
   * em vez de ativar imediatamente. Usado em testes E2E que precisam exercitar
   * o ciclo completo checkout → webhook → ativa. Ignorado por adapters reais
   * (que sempre retornam redirect de qualquer forma).
   */
  pendingMode?: boolean;
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
  /**
   * Referência externa definida no momento do checkout — usado pelo AsaasGateway
   * para reconectar o evento ao userId/planoId/ciclo quando nenhuma assinatura
   * pré-existe no banco (primeiro pagamento via redirect).
   */
  externalReference?: string;
  /** Valor pago (em BRL) — usado para criar o lançamento no caixa. */
  valor?: number;
  raw: Record<string, unknown>;
}

/**
 * Resultado da consulta proativa de status de pagamento.
 *
 *   "paid"    — gateway confirma pagamento recente; assinatura deve ser reativada.
 *   "unpaid"  — gateway confirma ausência de pagamento; prosseguir com expiração.
 *   "unknown" — gateway não retornou resposta definitiva (timeout, erro, indisponível,
 *               ou adapter sem suporte real). Comportamento conservador: expira.
 */
export type GatewayPaymentStatus = "paid" | "unpaid" | "unknown";

export interface PaymentGateway {
  readonly provider: string;
  /** Inicia o checkout de uma assinatura. */
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** Cancela a assinatura no gateway (no-op em adapters sem cobrança). */
  cancelSubscription(gatewaySubscriptionId: string | null): Promise<void>;
  /**
   * Valida e normaliza um webhook. `verifySignature` deve falhar (throw) se a
   * assinatura do payload for inválida no adapter real.
   *
   * `clientIp` deve ser resolvido pelo route handler (via `getClientIp`) antes
   * de chamar este método — não confiamos em headers arbitrários da requisição
   * para determinar a origem, pois podem ser forjados pelo chamador.
   */
  parseWebhook(rawBody: string, headers: Record<string, string>, clientIp?: string): Promise<NormalizedWebhookEvent>;
  /**
   * Consulta proativa ao gateway para verificar se a assinatura tem um pagamento
   * bem-sucedido recente. Usado pelo job de downgrade como segunda linha de defesa
   * contra interrupções prolongadas do gateway que impeçam a entrega de webhooks.
   *
   * Implementações devem retornar "unknown" em caso de erro ou indisponibilidade
   * do gateway — nunca propagar exceções. O job trata "unknown" de forma
   * conservadora, expirando a assinatura.
   */
  checkPaymentStatus(gatewaySubscriptionId: string | null): Promise<GatewayPaymentStatus>;
}
