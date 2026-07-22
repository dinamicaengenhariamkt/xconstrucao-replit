import { getPaymentGateway } from "@features/planos/gateway";

/**
 * J42–J50 — feature flag do marketplace/split. Espelha o padrão simples de
 * `PAYMENT_GATEWAY`: env var, toggle por redeploy. Default OFF.
 *
 * O split só faz sentido com o gateway Asaas real (subconta/wallet/split são
 * conceitos do Asaas), então o gate combina os dois.
 */
export function isMarketplaceSplitEnabled(): boolean {
  const flag = (process.env.MARKETPLACE_SPLIT ?? "off").toLowerCase() === "on";
  if (!flag) return false;
  return getPaymentGateway().provider === "asaas";
}
