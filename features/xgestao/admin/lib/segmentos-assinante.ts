/**
 * CRM-02/06/07/08/10 — recortes da lista de assinantes, em regras puras.
 *
 * A MESMA função filtra a tela (no navegador) e o CSV (no servidor): o botão
 * de exportar manda os parâmetros da URL e o arquivo sai com as mesmas linhas,
 * na mesma ordem, que o admin está vendo.
 */
import { compararSemUso, type EngajamentoAssinante } from './engajamento';
import {
  isCodigoSituacaoAssinante,
  type CodigoSituacaoAssinante,
  type MotivoAtencao,
  type SituacaoAssinante,
} from './situacao-assinante';
import { somenteDigitos } from './contato-assinante';

/** Recorte principal (um por vez, como os chips de situação). */
export type FiltroSegmento =
  | CodigoSituacaoAssinante
  | 'atencao'
  | 'sem_uso'
  | 'sem_empresa'
  | 'internas'
  /** CRM-08 — já pagou e perdeu o acesso (cancelou, estorno ou inadimplência vencida). */
  | 'saiu'
  /** CRM-10 — descida de plano marcada para a renovação. */
  | 'descida_agendada'
  /** CRM-10 — subiu de plano nos últimos 30 dias. */
  | 'subiu_30d'
  /** XG50 — assinou de novo depois de cancelar ou de um estorno. */
  | 'voltou'
  /** XG50 — 2+ ciclos cancelar/voltar em 90 dias ou tentativa de 2º teste/bônus bloqueada. */
  | 'cancela_volta'
  | '';

const SEGMENTOS_EXTRAS = ['atencao', 'sem_uso', 'sem_empresa', 'internas', 'saiu', 'descida_agendada', 'subiu_30d', 'voltou', 'cancela_volta'] as const;

/** CRM-06 — janela de tempo (combina com o recorte principal). */
export type JanelaSegmento = 'teste_7d' | 'teste_3d' | 'teste_1d' | 'renova_7d' | 'nunca_usou_teste' | '';
export const JANELAS_SEGMENTO: ReadonlyArray<Exclude<JanelaSegmento, ''>> = ['teste_7d', 'teste_3d', 'teste_1d', 'renova_7d', 'nunca_usou_teste'];
export const ROTULO_JANELA: Record<Exclude<JanelaSegmento, ''>, string> = {
  teste_7d: 'Teste acaba em até 7 dias',
  teste_3d: 'Teste acaba em até 3 dias',
  teste_1d: 'Teste acaba em até 1 dia',
  renova_7d: 'Renova em até 7 dias',
  nunca_usou_teste: 'Nunca usou no teste',
};

/** CRM-06 — ordenação. `''` mantém a ordem do servidor (entrada mais recente primeiro). */
export type OrdemSegmento = 'urgencia' | 'sem_uso' | 'atraso' | '';
export const ORDENS_SEGMENTO: ReadonlyArray<Exclude<OrdemSegmento, ''>> = ['urgencia', 'sem_uso', 'atraso'];
export const ROTULO_ORDEM: Record<OrdemSegmento, string> = {
  '': 'Entrada mais recente',
  urgencia: 'Urgência (dias restantes)',
  sem_uso: 'Dias sem uso',
  atraso: 'Dias de atraso',
};

export interface FiltrosSegmento {
  situacao: FiltroSegmento;
  janela: JanelaSegmento;
  ordem: OrdemSegmento;
  /** CRM-07 — só quem nunca recebeu contato registrado. */
  nuncaContatado: boolean;
  /** XG52 — só quem aceitou receber e-mail de marketing (base do CSV de campanha). */
  somenteMarketing?: boolean;
  busca: string;
}

/** O que a lista precisa de cada assinante para recortar e ordenar. */
export interface LinhaSegmentavel {
  empreiteiraNome: string;
  nome: string | null;
  email: string;
  semEmpresa: boolean;
  situacao: SituacaoAssinante;
  atencao: readonly MotivoAtencao[];
  engajamento: EngajamentoAssinante;
  contato?: { telefone: string | null; documento: string | null; cidade: string | null } | null;
  saida?: unknown | null;
  trocas?: { descidaAgendada: unknown | null; subidaRecente: unknown | null } | null;
  ultimoContato?: { em: string } | null;
  retorno?: { voltou: boolean; frequente: boolean } | null;
  marketing?: { aceito: boolean } | null;
}

export function filtroSegmentoDaUrl(valor: string | null | undefined): FiltroSegmento {
  if (!valor) return '';
  if ((SEGMENTOS_EXTRAS as readonly string[]).includes(valor)) return valor as FiltroSegmento;
  return isCodigoSituacaoAssinante(valor) ? valor : '';
}

export function filtrosDaUrl(params: { get(nome: string): string | null }): FiltrosSegmento {
  const janela = params.get('janela');
  const ordem = params.get('ordem');
  return {
    situacao: filtroSegmentoDaUrl(params.get('situacao')),
    janela: (JANELAS_SEGMENTO as readonly string[]).includes(janela ?? '') ? (janela as JanelaSegmento) : '',
    ordem: (ORDENS_SEGMENTO as readonly string[]).includes(ordem ?? '') ? (ordem as OrdemSegmento) : '',
    nuncaContatado: params.get('contato') === 'nunca',
    // Só aparece quando ligado: o objeto padrão continua o mesmo de antes.
    ...(params.get('marketing') === 'aceitou' ? { somenteMarketing: true } : {}),
    busca: (params.get('q') ?? '').slice(0, 200),
  };
}

/** Query string dos filtros ativos (sem os vazios), para a URL e o CSV. */
export function filtrosParaQuery(filtros: Partial<FiltrosSegmento>): string {
  const p = new URLSearchParams();
  if (filtros.situacao) p.set('situacao', filtros.situacao);
  if (filtros.janela) p.set('janela', filtros.janela);
  if (filtros.ordem) p.set('ordem', filtros.ordem);
  if (filtros.nuncaContatado) p.set('contato', 'nunca');
  if (filtros.somenteMarketing) p.set('marketing', 'aceitou');
  if (filtros.busca?.trim()) p.set('q', filtros.busca.trim());
  return p.toString();
}

export function normalizarBusca(texto: string | null | undefined): string {
  return (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function casaSegmento(linha: LinhaSegmentavel, filtro: FiltroSegmento): boolean {
  switch (filtro) {
    case '':
    case 'internas':
      return true;
    case 'atencao':
      return linha.atencao.length > 0;
    case 'sem_uso':
      return linha.atencao.some((m) => m.codigo === 'sem_uso');
    case 'sem_empresa':
      return linha.semEmpresa;
    case 'saiu':
      return Boolean(linha.saida);
    case 'descida_agendada':
      return Boolean(linha.trocas?.descidaAgendada);
    case 'subiu_30d':
      return Boolean(linha.trocas?.subidaRecente);
    case 'voltou':
      return Boolean(linha.retorno?.voltou);
    case 'cancela_volta':
      return Boolean(linha.retorno?.frequente);
    default:
      return linha.situacao.codigo === filtro;
  }
}

export function casaJanela(linha: LinhaSegmentavel, janela: JanelaSegmento): boolean {
  const { codigo, diasRestantes } = linha.situacao;
  const dias = diasRestantes ?? Infinity;
  switch (janela) {
    case '':
      return true;
    case 'teste_7d':
      return codigo === 'em_teste' && dias <= 7;
    case 'teste_3d':
      return codigo === 'em_teste' && dias <= 3;
    case 'teste_1d':
      return codigo === 'em_teste' && dias <= 1;
    // Próxima cobrança: de quem paga e de quem assinou no teste (1ª cobrança).
    case 'renova_7d':
      return (codigo === 'pago' || codigo === 'aguardando_pagamento') && dias <= 7;
    // No teste (ou nas 24h de tolerância) sem nenhum registro nas obras: abriu o
    // xgestão (o teste começa no 1º acesso) e não cadastrou nada.
    case 'nunca_usou_teste':
      return (codigo === 'em_teste' || codigo === 'teste_tolerancia') && !linha.engajamento.ultimoRegistroEm;
    default:
      return true;
  }
}

function casaBusca(linha: LinhaSegmentavel, termo: string): boolean {
  if (!termo) return true;
  const campos = [linha.empreiteiraNome, linha.nome, linha.email, linha.contato?.cidade];
  if (campos.some((c) => normalizarBusca(c).includes(termo))) return true;
  // Telefone e CPF/CNPJ: compara só os dígitos, com ou sem máscara.
  const digitos = somenteDigitos(termo);
  return digitos.length >= 4
    && [linha.contato?.telefone, linha.contato?.documento].some((c) => somenteDigitos(c).includes(digitos));
}

/** `null` vai para o fim; empate mantém a ordem de entrada (sort estável). */
function crescente(a: number | null, b: number | null): number {
  return (a ?? Infinity) - (b ?? Infinity);
}

export function ordenarSegmento<T extends LinhaSegmentavel>(linhas: readonly T[], ordem: OrdemSegmento): T[] {
  const copia = [...linhas];
  if (ordem === 'urgencia') return copia.sort((a, b) => crescente(a.situacao.diasRestantes, b.situacao.diasRestantes));
  if (ordem === 'sem_uso') return copia.sort((a, b) => compararSemUso(a.engajamento, b.engajamento));
  if (ordem === 'atraso') return copia.sort((a, b) => (b.situacao.diasEmAtraso ?? -1) - (a.situacao.diasEmAtraso ?? -1));
  return copia;
}

/** Recorte + janela + contato + opt-in de marketing + busca, já ordenado. */
export function aplicarSegmento<T extends LinhaSegmentavel>(linhas: readonly T[], filtros: Partial<FiltrosSegmento>): T[] {
  const termo = normalizarBusca((filtros.busca ?? '').trim());
  const visiveis = linhas.filter((linha) =>
    casaSegmento(linha, filtros.situacao ?? '')
    && casaJanela(linha, filtros.janela ?? '')
    && (!filtros.nuncaContatado || !linha.ultimoContato)
    && (!filtros.somenteMarketing || Boolean(linha.marketing?.aceito))
    && casaBusca(linha, termo));
  return ordenarSegmento(visiveis, filtros.ordem ?? '');
}
