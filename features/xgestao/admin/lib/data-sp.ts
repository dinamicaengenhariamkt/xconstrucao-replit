/**
 * ADM-08 — "hoje" do admin xgestão é o dia em São Paulo, não o do servidor (UTC).
 * Às 22h de Brasília já é o dia seguinte em UTC: comparar com `current_date` ou
 * `toISOString().slice(0, 10)` marcava obra e pagamento como atrasados 3 horas
 * antes da hora. No SQL o equivalente é `HOJE_SP_SQL` (em `server/situacao.ts`).
 */
const FORMATO_DIA = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Data civil de São Paulo (`YYYY-MM-DD`). */
export function hojeSaoPaulo(agora: Date = new Date()): string {
  return FORMATO_DIA.format(agora);
}

/** Mês civil de São Paulo (`YYYY-MM`) de um instante. */
export function mesCivilSaoPaulo(instante: Date): string {
  return hojeSaoPaulo(instante).slice(0, 7);
}

/** `YYYY-MM-DD` válido no começo do texto; o resto (hora) é ignorado. */
function diaIso(valor: string | null | undefined): string | null {
  const m = valor?.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** Obra com previsão vencida (antes de hoje em SP) e não concluída. */
export function obraAtrasadaEm(obra: { dataPrevisao: string | null; status: string }, agora: Date = new Date()): boolean {
  const previsao = diaIso(obra.dataPrevisao);
  return previsao !== null && obra.status !== 'concluida' && previsao < hojeSaoPaulo(agora);
}

/**
 * ADM-09 — lançamento de obra atrasado, calculado na hora: pendente com
 * vencimento antes de hoje (SP), ou já marcado `atrasado`. Não depende do job
 * diário que grava `atrasado`, que pode não ter rodado ou usar o dia de UTC.
 */
export function lancamentoAtrasadoEm(
  lancamento: { status: string; dataVencimento: string | null },
  agora: Date = new Date(),
): boolean {
  if (lancamento.status === 'atrasado') return true;
  if (lancamento.status !== 'pendente') return false;
  const vencimento = diaIso(lancamento.dataVencimento);
  return vencimento !== null && vencimento < hojeSaoPaulo(agora);
}
