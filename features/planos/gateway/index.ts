import type { PaymentGateway } from "./payment-gateway";
import { ManualGateway } from "./manual-gateway";
import { AsaasGateway } from "./asaas-gateway";

export type { PaymentGateway, CheckoutInput, CheckoutResult, NormalizedWebhookEvent, GatewayPaymentStatus } from "./payment-gateway";

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
}

export function getPaymentGateway(): PaymentGateway {
  if (cached) return cached;
  const provider = (process.env.PAYMENT_GATEWAY ?? "manual").toLowerCase();

  // O adapter manual não valida assinatura de webhook — proibido em produção.
  if (provider === "manual" && process.env.NODE_ENV === "production") {
    throw new Error(
      "[payment-gateway] adapter 'manual' não é permitido em produção — defina PAYMENT_GATEWAY com um provedor real (ex: 'asaas').",
    );
  }

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
