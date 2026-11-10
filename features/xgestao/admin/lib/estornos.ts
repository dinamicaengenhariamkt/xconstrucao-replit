/**
 * CRM-11 — estorno e chargeback de mensalidade do xgestão, em regras puras.
 *
 * O webhook normaliza os dois como `payment_refunded` (PAG-04), mas o id do
 * evento guardado é `<EVENTO_ASAAS>:<paymentId>` (`asaas-gateway.ts`): o
 * prefixo diz se foi devolução pedida (PAYMENT_REFUNDED, REFUND_IN_PROGRESS)
 * ou contestação no cartão (PAYMENT_CHARGEBACK_*, AWAITING_CHARGEBACK_REVERSAL).
 * Desde a revisão pré-publish o evento grava `payload_json.motivo`
 * ('estorno' | 'chargeback', normalizado no gateway): é a fonte principal.
 * O prefixo do id fica como apoio para eventos antigos, sem o campo.
 * Sem nenhum dos dois (lançamento manual, teste), fica "estorno".
 */
import { inicioDoMesSaoPaulo } from './metricas-comerciais';

export type TipoEstorno = 'estorno' | 'chargeback';

export const ROTULO_TIPO_ESTORNO: Record<TipoEstorno, string> = {
  estorno: 'Estorno',
  chargeback: 'Chargeback',
};

/** Basta um evento de chargeback do pagamento para a linha ser chargeback. */
export function classificarEstorno(
  idsEventoGateway: ReadonlyArray<string | null | undefined>,
  motivos: ReadonlyArray<string | null | undefined> = [],
): TipoEstorno {
  if (motivos.some((m) => m === 'chargeback')) return 'chargeback';
  return idsEventoGateway.some((id) => typeof id === 'string' && /^[A-Z_]*CHARGEBACK[A-Z_]*:/.test(id)) ? 'chargeback' : 'estorno';
}

export type PeriodoAdmin = 'mes' | '30d' | '90d';
export const PERIODOS_ADMIN: readonly PeriodoAdmin[] = ['mes', '30d', '90d'];
export const ROTULO_PERIODO: Record<PeriodoAdmin, string> = {
  mes: 'Mês atual',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
};

export function periodoDaUrl(valor: string | null | undefined): PeriodoAdmin {
  return (PERIODOS_ADMIN as readonly string[]).includes(valor ?? '') ? (valor as PeriodoAdmin) : 'mes';
}

/** Início do período: 1º dia do mês em São Paulo, ou agora menos N dias. */
export function inicioDoPeriodo(periodo: PeriodoAdmin, agora = new Date()): Date {
  if (periodo === 'mes') return inicioDoMesSaoPaulo(agora);
  const dias = periodo === '30d' ? 30 : 90;
  return new Date(agora.getTime() - dias * 24 * 60 * 60 * 1000);
}
