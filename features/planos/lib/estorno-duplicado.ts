/**
 * 10/11/2026 — pagamento de assinatura duplicada do xgestão (XG50).
 *
 * Quando um 2º checkout é concluído com um plano pago já valendo, o webhook
 * cancela a assinatura nova no gateway. Se o pagamento dela já foi confirmado
 * ou recebido, ele é estornado sozinho pelo gateway (antes o admin estornava no
 * painel). Só criada ou pendente: cancelar a assinatura basta, porque o Asaas
 * apaga a cobrança pendente junto.
 *
 * Idempotência: CONFIRMED e RECEIVED do mesmo pagamento chegam como dois
 * eventos. O histórico (`assinatura_eventos`) é a fonte: cada tentativa fica no
 * evento `assinatura_duplicada_cancelada` com `estornoAutomatico: true`, o
 * sucesso em `pagamento_duplicado_estornado` e a falha em
 * `pagamento_duplicado_estorno_falhou`. Uma falha deixa a próxima entrega do
 * webhook tentar de novo; uma tentativa em andamento ou um sucesso, não.
 *
 * Caixa: a entrada do pagamento duplicado nunca é lançada (o webhook não cria
 * assinatura nem mensalidade para ela), e o PAYMENT_REFUNDED que volta do
 * gateway não acha assinatura local para a subscription duplicada, então
 * também não lança saída. Nenhuma das duas: o caixa fica coerente.
 */
export type HistoricoEstornoDuplicado = {
  /** Já existe `pagamento_duplicado_estornado` para este pagamento. */
  estornado: boolean;
  /** Tentativas de estorno automático já registradas (claims). */
  tentativas: number;
  /** Tentativas que falharam (`pagamento_duplicado_estorno_falhou`). */
  falhas: number;
};

export type DecisaoDuplicado = 'estornar' | 'so_cancelar' | 'ja_tratado';

export function decidirEstornoDuplicado(args: {
  /** O evento é de pagamento confirmado/recebido (não só cobrança criada). */
  pagamentoConfirmado: boolean;
  paymentId?: string | null;
  historico: HistoricoEstornoDuplicado;
}): DecisaoDuplicado {
  if (!args.pagamentoConfirmado || !args.paymentId) return 'so_cancelar';
  const { estornado, tentativas, falhas } = args.historico;
  if (estornado) return 'ja_tratado';
  // Tentativa em andamento (outra entrega do mesmo pagamento) ainda sem desfecho.
  if (tentativas > falhas) return 'ja_tratado';
  return 'estornar';
}
