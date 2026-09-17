/**
 * XG21 — o período corrente de um checklist recorrente.
 *
 * O cliente pediu: *"deu meia-noite, ele zera, o stick some, daí eu tenho que
 * ir lá na obra e ticar tudo de novo"*.
 *
 * Não há cron neste projeto (sem `vercel.json`, sem `node-cron`, sem worker —
 * o padrão do repo é script `tsx` agendado à mão no painel do Replit). Uma
 * feature que só funciona se alguém lembrar de configurar um agendamento é uma
 * feature quebrada.
 *
 * Por isso o reset é **calculado, não executado**: cada marcação é gravada com
 * o `periodoRef` do dia (ou da semana) em que foi feita, e a tela lê sempre o
 * período corrente. À meia-noite o período muda, o novo período não tem
 * marcação nenhuma, e os itens aparecem desmarcados — sem job, sem UPDATE em
 * massa, e sem apagar o que ficou registrado ontem.
 *
 * Tudo em **America/Sao_Paulo** e calculado no servidor: a virada tem de
 * acontecer à meia-noite da obra, não à do fuso do navegador de quem abriu a
 * tela. É o mesmo fuso fixo que `features/planos/aviso-expiracao-job.ts` usa.
 */

export type ChecklistRecorrencia = 'nenhuma' | 'diaria' | 'semanal';

export const TIMEZONE_OBRA = 'America/Sao_Paulo';

/**
 * `YYYY-MM-DD` do instante em America/Sao_Paulo.
 *
 * `en-CA` porque é o locale cujo formato de data curta já é ISO — evita montar
 * a string na mão a partir de `getDate()`/`getMonth()`, que voltariam no fuso
 * do servidor e não no da obra.
 */
export function dataLocalISO(agora: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE_OBRA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

/** Dia da semana (0=domingo … 6=sábado) em America/Sao_Paulo. */
export function diaDaSemanaLocal(agora: Date = new Date()): number {
  const nome = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE_OBRA,
    weekday: 'short',
  }).format(agora);
  const dias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return dias[nome] ?? 0;
}

/** Subtrai dias de uma data `YYYY-MM-DD` sem passar por fuso nenhum. */
function subtrairDias(iso: string, dias: number): string {
  const [ano, mes, dia] = iso.split('-').map(Number);
  // UTC de propósito: aritmética pura de calendário, sem horário de verão.
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
}

/**
 * O `periodoRef` corrente, ou `null` quando o checklist não é recorrente.
 *
 * - `diaria` → a data de hoje.
 * - `semanal` → a data em que a semana corrente começou, ancorada em
 *   `diaSemana` (default 1 = segunda). Todo dia da mesma semana devolve o
 *   mesmo valor, que é o que faz as marcações caírem no mesmo balde.
 */
export function periodoAtual(
  recorrencia: ChecklistRecorrencia,
  diaSemana?: number | null,
  agora: Date = new Date(),
): string | null {
  if (recorrencia === 'nenhuma') return null;

  const hoje = dataLocalISO(agora);
  if (recorrencia === 'diaria') return hoje;

  const inicio = diaSemana == null || diaSemana < 0 || diaSemana > 6 ? 1 : diaSemana;
  const atual = diaDaSemanaLocal(agora);
  // Quantos dias voltar para chegar no início da semana. O `+ 7) % 7` cobre a
  // virada: domingo (0) com semana começando na segunda (1) volta 6 dias.
  const recuo = (atual - inicio + 7) % 7;
  return subtrairDias(hoje, recuo);
}

/** Rótulo curto para o selo do card. */
export function rotuloRecorrencia(
  recorrencia: ChecklistRecorrencia,
  diaSemana?: number | null,
): string | null {
  if (recorrencia === 'nenhuma') return null;
  if (recorrencia === 'diaria') return 'Repete todo dia';
  const nomes = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const i = diaSemana == null || diaSemana < 0 || diaSemana > 6 ? 1 : diaSemana;
  return `Repete toda ${nomes[i]}`;
}
