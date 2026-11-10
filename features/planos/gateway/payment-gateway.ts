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
  tier: import("@shared/lib/plans-catalog").PlanoTier;
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
  /**
   * XG43 — data da 1ª cobrança quando ela não é imediata (bônus de +1 mês do
   * teste xgestão, ou nova assinatura dentro do período já pago).
   */
  primeiraCobrancaEm?: Date;
}

export type CheckoutResult =
  // Gateway hospedado: redireciona o usuário para pagar.
  // `gatewayCustomerId` é devolvido para que o service possa persistir o ID
  // em `users.asaas_customer_id` (cache J44). Sem isso cada checkout refaz
  // o lookup por e-mail, e IDs de ambientes cruzados nunca são corrigidos.
  | { kind: "redirect"; url: string; gatewaySubscriptionId?: string; gatewayCustomerId?: string }
  // Ativação imediata (adapter manual / planos gratuitos): já confirma.
  | { kind: "activated"; gatewayCustomerId?: string; gatewaySubscriptionId?: string };

/** Evento normalizado a partir de um webhook do gateway. */
export interface NormalizedWebhookEvent {
  /** ID único do evento no gateway — chave de idempotência. */
  eventId: string;
  type:
    | "subscription_activated"
    | "payment_succeeded"
    | "payment_failed"
    // XG43 — cobrança criada (PAYMENT_CREATED) de assinatura da plataforma.
    // Só ativa a assinatura xgestão cuja 1ª cobrança é futura.
    | "payment_created"
    // PAG-03 — cobrança de assinatura da plataforma apagada (PAYMENT_DELETED).
    // O Asaas apaga a cobrança pendente quando a assinatura é cancelada ou
    // trocada: não é falta de pagamento. Cobranças de obra/anúncio seguem
    // chegando como `payment_failed`, como antes.
    | "payment_deleted"
    // PAG-04 — estorno ou chargeback de cobrança de assinatura da plataforma.
    // Obra/anúncio continuam ignorando esses eventos.
    | "payment_refunded"
    | "subscription_canceled"
    // J46 — eventos de status de subconta (KYC). Roteados para
    // aplicarEventoSubconta, NÃO para aplicarEventoWebhook (assinatura).
    | "account_status_changed"
    | "ignored";
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
  /** XG43 — vencimento da cobrança (`YYYY-MM-DD`) nos eventos de pagamento. */
  dueDate?: string;
  /**
   * XG45 — id do pagamento no gateway. CONFIRMED e RECEIVED do mesmo
   * pagamento chegam com eventIds distintos; é este id que impede contar a
   * mesma mensalidade duas vezes no caixa.
   */
  paymentId?: string;
  /**
   * REV-08 — só em `payment_refunded`: estorno (REFUNDED/REFUND_IN_PROGRESS)
   * ou chargeback (CHARGEBACK_REQUESTED).
   */
  motivo?: "estorno" | "chargeback";
  /** J46 — id da subconta Asaas (account.id) nos eventos de conta/KYC. */
  accountId?: string;
  /**
   * J46 — situação normalizada da subconta derivada do evento ACCOUNT_STATUS_*:
   *   "approved"  — aprovação GERAL concedida (subconta apta a receber).
   *   "rejected"  — alguma etapa rejeitada.
   *   "pending"   — etapa intermediária aprovada/pendente (segue aguardando).
   */
  accountStatus?: "approved" | "rejected" | "pending";
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

/** XG48 — cobrança ainda não paga de uma assinatura (a próxima fatura). */
export interface CobrancaPendente {
  id: string;
  valor: number;
  /** Vencimento `YYYY-MM-DD`. */
  vencimento: string;
}

export interface PaymentGateway {
  readonly provider: string;
  /**
   * XG48 — troca de plano: muda o valor da assinatura e das cobranças ainda
   * pendentes (`updatePendingPayments`). Opcional: adapters sem cobrança
   * recorrente remota não implementam.
   */
  atualizarValorAssinatura?(gatewaySubscriptionId: string, valor: number): Promise<void>;
  /** XG48 — a próxima cobrança pendente da assinatura (menor vencimento), se já existir. */
  proximaCobrancaPendente?(gatewaySubscriptionId: string): Promise<CobrancaPendente | null>;
  /** XG48 — muda o valor de uma cobrança pendente (soma da diferença proporcional). */
  atualizarValorCobranca?(paymentId: string, valor: number): Promise<void>;
  /**
   * 10/11/2026 — estorna por inteiro um pagamento já confirmado/recebido (ex.:
   * pagamento de assinatura duplicada, XG50). Opcional: sem ele, o service
   * registra a falha e avisa o admin para estornar no painel.
   */
  refundPayment?(paymentId: string): Promise<void>;
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
