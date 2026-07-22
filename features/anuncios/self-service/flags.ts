import { getPaymentGateway } from "@features/planos/gateway";

/**
 * J31 — feature flag da cobrança real de anúncio. Espelha o padrão de
 * `MARKETPLACE_SPLIT`: env var + toggle por redeploy. Default OFF (protótipo).
 *
 * A cobrança real só faz sentido com o gateway Asaas ativo (a cobrança one-off é
 * criada na conta-mãe via Asaas), então o gate combina os dois — igual ao split.
 */
export function isAdPaymentEnabled(): boolean {
  const flag = (process.env.AD_PAYMENT_GATEWAY ?? "off").toLowerCase() === "asaas";
  if (!flag) return false;
  return getPaymentGateway().provider === "asaas";
}
