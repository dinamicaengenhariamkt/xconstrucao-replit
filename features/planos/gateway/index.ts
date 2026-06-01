import type { PaymentGateway } from "./payment-gateway";
import { ManualGateway } from "./manual-gateway";

export type { PaymentGateway, CheckoutInput, CheckoutResult, NormalizedWebhookEvent } from "./payment-gateway";

/**
 * Factory do gateway de pagamento. Resolve o adapter por `PAYMENT_GATEWAY`
 * (default "manual"). Para plugar um gateway real (J14): adicionar o adapter
 * (ex: StripeGateway) e mapear aqui — nenhum caller muda.
 */
let cached: PaymentGateway | null = null;

export function getPaymentGateway(): PaymentGateway {
  if (cached) return cached;
  const provider = (process.env.PAYMENT_GATEWAY ?? "manual").toLowerCase();
  // Segurança: o adapter manual não valida assinatura de webhook (aceita payload
  // forjado). Proibido em produção — exige um gateway real (J14).
  if (provider === "manual" && process.env.NODE_ENV === "production") {
    throw new Error(
      "[payment-gateway] adapter 'manual' não é permitido em produção — defina PAYMENT_GATEWAY com um provedor real (ver Jornada 14).",
    );
  }
  switch (provider) {
    case "manual":
      cached = new ManualGateway();
      break;
    // case "stripe": cached = new StripeGateway(); break;   // J14
    // case "mercadopago": cached = new MercadoPagoGateway(); break;  // J14
    default:
      console.warn(`[payment-gateway] provider "${provider}" desconhecido — usando manual.`);
      cached = new ManualGateway();
  }
  return cached;
}
