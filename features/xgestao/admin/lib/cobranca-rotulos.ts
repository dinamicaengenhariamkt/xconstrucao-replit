/** ADM-03 — tipos de problema de cobrança e seus rótulos (servidor e tela). */
export type TipoProblemaCobranca = 'pagamento_recusado' | 'estorno' | 'webhook_preso' | 'pendente_reativacao' | 'inadimplente';

export const TIPOS_PROBLEMA_COBRANCA: TipoProblemaCobranca[] = [
  'inadimplente', 'pagamento_recusado', 'estorno', 'pendente_reativacao', 'webhook_preso',
];

export const ROTULO_PROBLEMA_COBRANCA: Record<TipoProblemaCobranca, string> = {
  pagamento_recusado: 'Pagamento recusado',
  estorno: 'Estorno ou chargeback',
  webhook_preso: 'Aviso do gateway parado',
  pendente_reativacao: 'Presa em reativação',
  inadimplente: 'Inadimplente',
};
