/**
 * J23 — Porta de billing do self-service de anúncios.
 *
 * O checkout do anunciante chama esta porta para "cobrar" um pedido. Hoje a única
 * implementação é `PrototipoBilling`, que NÃO cobra de verdade — apenas registra o
 * pedido como adquirido (`cobrancaStatus = 'prototipo'`). A cobrança real (gateway
 * Pix/cartão) é a J31, que implementará outra `BillingPort` (one-off, via J14) e a
 * plugará aqui SEM mexer em telas nem schema — só trocando a implementação.
 *
 * Ver docs/jornadas/23-meus-anuncios-self-service.md (D5) e 31-pagamento-anuncios.md.
 */

export type CobrancaStatus = "prototipo" | "pendente" | "paga" | "isenta";

export interface CobrarArgs {
  pedidoId: string;
  solicitanteUserId: string;
  valorTotal: number;
  descricao: string;
}

export type CobrarResult =
  | { kind: "adquirido"; cobrancaStatus: CobrancaStatus }
  | { kind: "redirect"; url: string; cobrancaStatus: CobrancaStatus };

export interface BillingPort {
  readonly nome: string;
  /** Simulação ou cobrança real — define o estado inicial de cobrança do pedido. */
  cobrar(args: CobrarArgs): Promise<CobrarResult>;
}

/**
 * Implementação de protótipo: não cobra, apenas confirma a "aquisição". O preço é
 * calculado e exibido (transparência), o pedido é persistido, mas nenhum valor é
 * capturado. A J31 substitui por uma porta que retorna `{ kind: 'redirect', url }`.
 */
export const PrototipoBilling: BillingPort = {
  nome: "prototipo",
  async cobrar(_args: CobrarArgs): Promise<CobrarResult> {
    return { kind: "adquirido", cobrancaStatus: "prototipo" };
  },
};

/**
 * Resolve a porta de billing ativa. Hoje sempre protótipo. A J31 lerá uma env
 * (ex.: AD_PAYMENT_GATEWAY) para decidir entre protótipo e gateway real.
 */
export function getBillingPort(): BillingPort {
  return PrototipoBilling;
}
