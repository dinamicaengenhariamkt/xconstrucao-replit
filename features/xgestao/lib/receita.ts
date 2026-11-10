/**
 * XG45 — origem dos lançamentos de mensalidade do xgestão no caixa da
 * plataforma (`financeiro.origem_tipo`). A chave (`origem_id`) é o id do
 * pagamento no gateway: um lançamento por pagamento, nunca dois.
 * Módulo leve de propósito: o admin lê a constante sem importar o serviço de
 * assinatura (gateway, notificações).
 */
export const ORIGEM_MENSALIDADE_XGESTAO = 'xgestao_mensalidade';

/**
 * PAG-04 — estorno/chargeback de uma mensalidade do xgestão. Saída paga no
 * caixa da plataforma com a mesma chave (`origem_id` = id do pagamento), então
 * é idempotente entre REFUND_IN_PROGRESS, REFUNDED e as etapas do chargeback.
 */
export const ORIGEM_ESTORNO_MENSALIDADE_XGESTAO = 'xgestao_mensalidade_estorno';
