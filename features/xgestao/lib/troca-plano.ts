/**
 * XG48 — regras puras da troca de plano do xgestão (sem banco, sem
 * `server-only`): rodam no servidor, nos testes com `tsx` e na tela.
 *
 * Decisões do Ramon (10/11/2026):
 * - subir: vale na hora; a diferença proporcional aos dias que faltam até a
 *   renovação entra somada só na próxima fatura; depois, o valor novo cheio;
 * - descer: o plano atual vale até a renovação; a próxima fatura já vem com o
 *   valor menor; obras e pessoas acima do limite ficam só para visualização,
 *   pela escolha feita uma única vez no momento da troca.
 */
import { somarMeses } from './acesso-plano';

export const TIERS_TROCA = ['basic', 'basic_plus', 'premium'] as const;
export type TierTroca = (typeof TIERS_TROCA)[number];

export const FUSO_SP = 'America/Sao_Paulo';

export const MSG_OBRA_BLOQUEADA_POR_PLANO =
  'Esta obra está só para visualização no seu plano atual. Para editar, mude para um plano maior.';
const DIA_MS = 24 * 60 * 60 * 1000;

export function ehTierTroca(tier: string | null | undefined): tier is TierTroca {
  return (TIERS_TROCA as readonly string[]).includes(tier ?? '');
}

export function ordemTier(tier: string): number {
  return (TIERS_TROCA as readonly string[]).indexOf(tier);
}

/** `YYYY-MM-DD` do instante no calendário de São Paulo. */
export function dataSp(instante: Date): string {
  return instante.toLocaleDateString('en-CA', { timeZone: FUSO_SP });
}

/** Número do dia (calendário de São Paulo), para contar dias sem erro de fuso. */
function numeroDoDiaSp(instante: Date): number {
  const [a, m, d] = dataSp(instante).split('-').map(Number);
  return Math.round(Date.UTC(a, m - 1, d) / DIA_MS);
}

/** Dias de calendário (São Paulo) de `de` até `ate`. Negativo se `ate` já passou. */
export function diasEntreSp(de: Date, ate: Date): number {
  return numeroDoDiaSp(ate) - numeroDoDiaSp(de);
}

export function emCentavos(valor: number | string): number {
  return Math.round(Number(valor) * 100);
}

export function deCentavos(centavos: number): number {
  return centavos / 100;
}

export type Proporcional = {
  /** Dias do ciclo pago atual: do início do período até `renovaEm`. */
  diasCiclo: number;
  /** Dias que faltam até `renovaEm` (0 a `diasCiclo`). */
  diasRestantes: number;
  /** Diferença a somar na próxima fatura, em reais (2 casas). 0 se não subir. */
  diferenca: number;
};

/**
 * (valorNovo − valorAtual) × diasRestantes ÷ diasDoCiclo, em São Paulo,
 * arredondado a centavos. O ciclo mensal começa 1 mês de calendário antes de
 * `renovaEm` (`somarMeses`), então fevereiro tem 28 ou 29 dias e janeiro 31.
 */
export function calcularProporcional(args: {
  valorAtual: number | string;
  valorNovo: number | string;
  renovaEm: Date;
  agora?: Date;
  ciclo?: 'mensal' | 'anual';
}): Proporcional {
  const agora = args.agora ?? new Date();
  const inicio = somarMeses(args.renovaEm, args.ciclo === 'anual' ? -12 : -1);
  const diasCiclo = Math.max(1, diasEntreSp(inicio, args.renovaEm));
  const diasRestantes = Math.min(diasCiclo, Math.max(0, diasEntreSp(agora, args.renovaEm)));
  const delta = emCentavos(args.valorNovo) - emCentavos(args.valorAtual);
  const centavos = delta > 0 ? Math.round((delta * diasRestantes) / diasCiclo) : 0;
  return { diasCiclo, diasRestantes, diferenca: deCentavos(centavos) };
}

/** Valor da próxima fatura: o do plano que vale no próximo ciclo + diferenças não pagas. */
export function valorProximaFatura(valorBase: number | string, diferencasPendentes: Array<number | string>): number {
  return deCentavos(emCentavos(valorBase) + diferencasPendentes.reduce<number>((t, d) => t + emCentavos(d), 0));
}

export type EstadoAssinaturaTroca = {
  status: string;
  provider: string;
  tier: string;
  canceladaEm: Date | null;
  primeiroPagamentoEm: Date | null;
  /** Fim do teste grátis que originou a assinatura (mês bônus). */
  fimTesteEm: Date | null;
  renovaEm: Date | null;
};

/**
 * REV-04 — "ainda sem pagamento" só vale para quem veio do teste (mês bônus).
 * `primeiro_pagamento_em` nasceu em 10/11/2026: assinatura paga antiga tem a
 * coluna nula e `fim_teste_em` nulo, e conta como paga (senão subiria de plano
 * sem pagar o proporcional).
 */
export function aindaSemPagamento(a: Pick<EstadoAssinaturaTroca, 'primeiroPagamentoEm' | 'fimTesteEm'>): boolean {
  return !a.primeiroPagamentoEm && a.fimTesteEm != null;
}

export type TrocaAgendadaLida = { tierDe: string; tierPara: string } | null;

export type DecisaoTroca =
  | { acao: 'checkout' }
  | { acao: 'bloquear'; codigo: CodigoBloqueio }
  | { acao: 'subir' }
  | { acao: 'subir_sem_proporcional' }
  | { acao: 'descer' }
  | { acao: 'descer_imediata' }
  | { acao: 'desfazer' }
  | { acao: 'desfazer_e_subir' };

export type CodigoBloqueio =
  | 'PLANO_INVALIDO'
  | 'MESMO_PLANO'
  | 'INADIMPLENTE'
  | 'CANCELAMENTO_AGENDADO'
  | 'TROCA_AGENDADA';

export const MENSAGENS_BLOQUEIO: Record<CodigoBloqueio | 'SEM_ASSINATURA', string> = {
  PLANO_INVALIDO: 'Plano inválido.',
  MESMO_PLANO: 'Você já está neste plano.',
  INADIMPLENTE: 'Há uma fatura em atraso. Regularize o pagamento antes de mudar de plano.',
  CANCELAMENTO_AGENDADO: 'Sua assinatura está cancelada e vale até o fim do período pago. Para continuar em outro plano, assine o plano desejado: a cobrança só começa quando o período atual acabar.',
  TROCA_AGENDADA: 'Já existe uma mudança de plano agendada. Para escolher outro plano menor, desfaça a mudança atual primeiro.',
  SEM_ASSINATURA: 'Você ainda não tem uma assinatura paga. Escolha um plano para assinar.',
};

/**
 * Máquina de estados da troca. Quem está no teste sem assinatura, ou sem
 * assinatura paga vigente, passa pelo checkout normal (não é troca).
 */
export function decidirTroca(args: {
  assinatura: EstadoAssinaturaTroca | null;
  agendada: TrocaAgendadaLida;
  tierPara: string;
}): DecisaoTroca {
  const { assinatura, agendada, tierPara } = args;
  if (!ehTierTroca(tierPara)) return { acao: 'bloquear', codigo: 'PLANO_INVALIDO' };
  if (!assinatura || assinatura.provider === 'trial' || !ehTierTroca(assinatura.tier)) return { acao: 'checkout' };
  if (assinatura.status === 'inadimplente') return { acao: 'bloquear', codigo: 'INADIMPLENTE' };
  if (assinatura.status !== 'ativa') return { acao: 'checkout' };
  if (assinatura.canceladaEm) return { acao: 'bloquear', codigo: 'CANCELAMENTO_AGENDADO' };

  const atual = ordemTier(assinatura.tier);
  const novo = ordemTier(tierPara);
  if (agendada) {
    if (tierPara === assinatura.tier) return { acao: 'desfazer' };
    if (novo > atual) return { acao: 'desfazer_e_subir' };
    return { acao: 'bloquear', codigo: 'TROCA_AGENDADA' };
  }
  if (novo === atual) return { acao: 'bloquear', codigo: 'MESMO_PLANO' };
  // Mês bônus do teste (ou 1ª cobrança futura) ainda não pago: só muda o
  // plano e o valor da 1ª cobrança, sem proporcional.
  const semPagamento = aindaSemPagamento(assinatura);
  if (novo > atual) return semPagamento ? { acao: 'subir_sem_proporcional' } : { acao: 'subir' };
  return semPagamento ? { acao: 'descer_imediata' } : { acao: 'descer' };
}

export type ItemEscolha = { id: string; criadoEm: Date | null };

/**
 * O que continua editável/ativo depois da descida. A escolha do dono vale
 * primeiro; vagas que sobrarem (obra escolhida concluída, por exemplo) são
 * preenchidas pelos itens mais antigos. `limite < 0` = sem limite.
 */
export function selecionarMantidos(itens: ItemEscolha[], escolhidos: string[] | null | undefined, limite: number): Set<string> {
  if (limite < 0) return new Set(itens.map((i) => i.id));
  const ids = new Set(itens.map((i) => i.id));
  const mantidos = new Set<string>();
  for (const id of escolhidos ?? []) {
    if (mantidos.size >= limite) break;
    if (ids.has(id)) mantidos.add(id);
  }
  const ordenados = [...itens].sort((a, b) => (a.criadoEm?.getTime() ?? 0) - (b.criadoEm?.getTime() ?? 0));
  for (const item of ordenados) {
    if (mantidos.size >= limite) break;
    mantidos.add(item.id);
  }
  return mantidos;
}

/**
 * Validação da escolha feita no diálogo: sem repetidos, só ids válidos e,
 * quando há excesso, exatamente o limite (não deixa confirmar sem escolher).
 */
export function validarEscolha(disponiveis: string[], escolhidos: string[] | undefined, limite: number): string | null {
  if (limite < 0 || disponiveis.length <= limite) return null;
  const lista = escolhidos ?? [];
  if (new Set(lista).size !== lista.length) return 'Há itens repetidos na escolha.';
  if (lista.some((id) => !disponiveis.includes(id))) return 'A escolha tem itens que não pertencem à empresa ou não estão em andamento.';
  if (lista.length !== limite) return `Escolha exatamente ${limite}.`;
  return null;
}

/** Links que passam do limite por obra: os mais novos de cada obra (entrada em ordem de criação). */
export function linksExcedentes(links: Array<{ id: string; obraId: string }>, limitePorObra: number): string[] {
  if (limitePorObra < 0) return [];
  const porObra = new Map<string, string[]>();
  for (const l of links) porObra.set(l.obraId, [...(porObra.get(l.obraId) ?? []), l.id]);
  return [...porObra.values()].flatMap((ids) => ids.slice(limitePorObra));
}
