import { createPaymentWithSplit } from "@shared/lib/asaas-client";
import { findOrCreateCustomer } from "@features/planos/gateway/asaas-gateway";

/**
 * J31 — cobrança real de pedido de anúncio (one-off) via Asaas.
 *
 * Espelha `features/marketplace/split-service.ts`, mas SEM split: o anúncio é
 * 100% receita da plataforma (conta-mãe). Reusa `createPaymentWithSplit` com
 * `split: []` (mesma rota `POST /payments` DETACHED) e `findOrCreateCustomer`
 * para o customer LAZY do anunciante (coletado no checkout — anunciante não tem
 * customer proativo). Ver docs/asaas-modelo-financeiro.md.
 */

export const EXTERNAL_REF_ANUNCIO_PREFIX = "xconstrucao-anuncio";

/** Monta o externalReference de um pagamento de anúncio. */
export function buildExternalRefAnuncio(pedidoId: string): string {
  return `${EXTERNAL_REF_ANUNCIO_PREFIX}|${pedidoId}`;
}

/** Parseia o externalReference de anúncio `xconstrucao-anuncio|pedidoId`. */
export function parseExternalRefAnuncio(ref: string | null | undefined): { pedidoId: string } | null {
  if (!ref) return null;
  const parts = ref.split("|");
  if (parts.length !== 2 || parts[0] !== EXTERNAL_REF_ANUNCIO_PREFIX) return null;
  return { pedidoId: parts[1] };
}

/** Vencimento em N dias a partir de hoje (yyyy-mm-dd). */
function dueDateFromNow(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export interface CobrarAnuncioInput {
  pedidoId: string;
  customerId: string;
  valorTotal: number;
  descricao: string;
}

export interface CobrarAnuncioResult {
  asaasPaymentId: string;
  invoiceUrl: string;
}

/**
 * Cria a cobrança one-off do pedido de anúncio na conta-mãe (sem split).
 * `billingType: UNDEFINED` deixa o pagador escolher PIX/Boleto/Cartão.
 */
export async function cobrarAnuncio(input: CobrarAnuncioInput): Promise<CobrarAnuncioResult> {
  const payment = await createPaymentWithSplit({
    customer: input.customerId,
    billingType: "UNDEFINED",
    value: input.valorTotal,
    dueDate: dueDateFromNow(3),
    description: input.descricao,
    externalReference: buildExternalRefAnuncio(input.pedidoId),
    split: [], // 100% conta-mãe — anúncio é receita integral da plataforma.
  });
  return { asaasPaymentId: payment.id, invoiceUrl: payment.invoiceUrl ?? "" };
}

/** Cria/reusa o customer Asaas do anunciante (lazy — coletado no checkout). */
export async function resolverCustomerAnunciante(args: {
  email: string;
  name: string;
  cpfCnpj: string;
}): Promise<string> {
  const customer = await findOrCreateCustomer(args.email, args.name, args.cpfCnpj);
  return customer.id;
}
