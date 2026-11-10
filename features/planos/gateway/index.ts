import type { PaymentGateway } from "./payment-gateway";
import { ManualGateway } from "./manual-gateway";
import { AsaasGateway } from "./asaas-gateway";

export type { PaymentGateway, CheckoutInput, CheckoutResult, NormalizedWebhookEvent, GatewayPaymentStatus, CobrancaPendente } from "./payment-gateway";

/**
 * Factory do gateway de pagamento. Resolve o adapter por `PAYMENT_GATEWAY`
 * (default "manual"). Para plugar um gateway real (J14): adicionar o adapter
 * e mapear aqui — nenhum caller muda.
 *
 * Adapters disponíveis:
 *   manual — stub sem cobrança (testes/dev; bloqueado em produção)
 *   asaas  — checkout hospedado recorrente do Asaas (Cartão); sandbox e prod
 */
let cached: PaymentGateway | null = null;

/**
 * Test-only seam — override the cached gateway singleton so integration tests
 * can inject a mock without touching process.env or spawning a real gateway.
 *
 * Pass `null` to restore normal factory behaviour (next call re-resolves from env).
 *
 * Never call this in production code.
 */
export function _overrideGatewayForTest(gw: PaymentGateway | null): void {
  cached = gw;
  sobrescritoEmTeste = gw !== null;
}

let sobrescritoEmTeste = false;
let manualLocal: PaymentGateway | null = null;

/**
 * Gateway que criou a assinatura. Fora de produção, uma assinatura antiga do
 * adapter manual não pode ir ao Asaas sandbox (o id dela não existe lá), então
 * usa o manual. Em produção o manual é proibido e vale sempre o do ambiente.
 */
export function gatewayDaAssinatura(provider: string | null | undefined): PaymentGateway {
  if (!sobrescritoEmTeste && provider === "manual" && process.env.NODE_ENV !== "production") {
    manualLocal ??= new ManualGateway();
    return manualLocal;
  }
  return getPaymentGateway();
}

/**
 * REV-02 — gateway ausente ou inválido em produção. Rotas de pagamento
 * respondem 503 (e o webhook 503 GATEWAY_NAO_CONFIGURADO, não 400, para o
 * Asaas não pausar a fila achando que a assinatura do evento é inválida).
 */
export class GatewayNaoConfiguradoError extends Error {
  readonly code = "GATEWAY_NAO_CONFIGURADO" as const;
  constructor(motivo: string) {
    super(`[payment-gateway] ${motivo}`);
    this.name = "GatewayNaoConfiguradoError";
  }
}

export const MENSAGEM_PAGAMENTOS_INDISPONIVEIS = "Pagamentos indisponíveis no momento. Tente mais tarde.";

export type ConferenciaGateway = { ok: true; provider: string } | { ok: false; motivo: string };

/**
 * Função pura sobre o env. Em produção só `asaas` vale; fora dela o manual
 * (padrão) e o asaas valem. Nunca lê nem devolve chave.
 */
export function conferirGatewayPagamento(env: Record<string, string | undefined> = process.env): ConferenciaGateway {
  const bruto = env.PAYMENT_GATEWAY?.trim().toLowerCase();
  if (env.NODE_ENV === "production") {
    if (!bruto) return { ok: false, motivo: "PAYMENT_GATEWAY não definido em produção; pagamentos desligados" };
    if (bruto !== "asaas") return { ok: false, motivo: `PAYMENT_GATEWAY="${bruto}" não é aceito em produção (use asaas); pagamentos desligados` };
    return { ok: true, provider: "asaas" };
  }
  return { ok: true, provider: bruto || "manual" };
}

export function ehGatewayNaoConfigurado(err: unknown): err is GatewayNaoConfiguradoError {
  return err instanceof GatewayNaoConfiguradoError
    || (err instanceof Error && (err as { code?: unknown }).code === "GATEWAY_NAO_CONFIGURADO");
}

export function getPaymentGateway(): PaymentGateway {
  if (cached) return cached;
  // Em produção: ausente, manual (não valida assinatura de webhook) ou
  // desconhecido são erro de configuração, nunca queda silenciosa no manual.
  const conferencia = conferirGatewayPagamento();
  if (!conferencia.ok) throw new GatewayNaoConfiguradoError(conferencia.motivo);
  const provider = conferencia.provider;

  switch (provider) {
    case "manual":
      cached = new ManualGateway();
      break;
    case "asaas":
      cached = new AsaasGateway();
      break;
    default:
      console.warn(`[payment-gateway] provider "${provider}" desconhecido — usando manual.`);
      cached = new ManualGateway();
  }
  return cached;
}
