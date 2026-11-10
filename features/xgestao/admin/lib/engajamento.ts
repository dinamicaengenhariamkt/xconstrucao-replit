/**
 * XG46 — engajamento dos assinantes do xgestão (Lote C), em regras puras.
 *
 * Dois sinais, os dois gravados pelo próprio app (nada é estimado):
 * - **uso**: o último login (`users.last_login_at`) ou a última renovação da
 *   sessão (`sessions.last_used_at`, a cada ~15 min de app aberto), do titular
 *   e da equipe da empresa;
 * - **registro**: o último dado lançado nas obras (diário, financeiro, fotos,
 *   ocorrências, anexos, etapas, checklist), a mesma conta da "obra parada".
 * O que vale é o mais recente dos dois.
 */
import type { CodigoSituacaoAssinante } from './situacao-assinante';

const DIA_MS = 24 * 60 * 60 * 1000;

export const DIAS_ATIVO_SEMANA = 7;
export const DIAS_ATIVO_MES = 30;
/** Quem paga ou está no teste e passa disso sem usar pede atenção (risco de cancelar). */
export const DIAS_SEM_USO = 14;

export type NivelEngajamento = 'ativo_7d' | 'ativo_30d' | 'inativo' | 'nunca';

export const NIVEIS_ENGAJAMENTO: readonly NivelEngajamento[] = ['ativo_7d', 'ativo_30d', 'inativo', 'nunca'];

export const ROTULO_ENGAJAMENTO: Record<NivelEngajamento, string> = {
  ativo_7d: 'Usou nos últimos 7 dias',
  ativo_30d: 'Usou entre 8 e 30 dias',
  inativo: 'Sem uso há mais de 30 dias',
  nunca: 'Nunca usou',
};

export interface SinaisEngajamento {
  /** Último uso do titular (login ou sessão). */
  usoTitular: Date | null;
  /** Último uso de qualquer pessoa da equipe (sem o titular). */
  usoEquipe: Date | null;
  /** Último registro nas obras da empresa. */
  registro: Date | null;
  /** Registros lançados nas obras nos últimos 30 dias. */
  registros30d: number;
}

export interface EngajamentoAssinante {
  nivel: NivelEngajamento;
  ultimoUsoTitularEm: string | null;
  ultimoUsoEquipeEm: string | null;
  ultimoRegistroEm: string | null;
  /** O mais recente dos três. */
  ultimoSinalEm: string | null;
  /** Dias inteiros desde o último sinal; `null` se nunca houve. */
  diasSemUso: number | null;
  registros30d: number;
}

function maisRecente(...datas: Array<Date | null>): Date | null {
  return datas.reduce<Date | null>((m, d) => (d && (!m || d > m) ? d : m), null);
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function engajamentoAssinante(sinais: SinaisEngajamento, agora = new Date()): EngajamentoAssinante {
  // Data no futuro (relógio do servidor) não pode virar "dias negativos".
  const ultimo = maisRecente(sinais.usoTitular, sinais.usoEquipe, sinais.registro);
  const dias = ultimo ? Math.max(0, Math.floor((agora.getTime() - ultimo.getTime()) / DIA_MS)) : null;
  const nivel: NivelEngajamento = dias === null
    ? 'nunca'
    : dias < DIAS_ATIVO_SEMANA ? 'ativo_7d' : dias < DIAS_ATIVO_MES ? 'ativo_30d' : 'inativo';
  return {
    nivel,
    ultimoUsoTitularEm: iso(sinais.usoTitular),
    ultimoUsoEquipeEm: iso(sinais.usoEquipe),
    ultimoRegistroEm: iso(sinais.registro),
    ultimoSinalEm: iso(ultimo),
    diasSemUso: dias,
    registros30d: sinais.registros30d,
  };
}

/** Situações em que a falta de uso é risco de perder receita. */
// CRM-04 — quem assinou no teste e ainda não pagou também: parar de usar antes
// da 1ª cobrança é o caminho mais curto para cancelar.
const SITUACOES_COM_RISCO: ReadonlySet<CodigoSituacaoAssinante> = new Set(['pago', 'em_teste', 'aguardando_pagamento']);

/** Paga (ou está no teste) e não usa há {@link DIAS_SEM_USO} dias ou mais. */
export function semUsoComRisco(situacao: CodigoSituacaoAssinante, engajamento: EngajamentoAssinante): boolean {
  if (!SITUACOES_COM_RISCO.has(situacao)) return false;
  return engajamento.diasSemUso === null || engajamento.diasSemUso >= DIAS_SEM_USO;
}

export interface GrupoEngajamento {
  total: number;
  porNivel: Record<NivelEngajamento, number>;
  /** Ativos em 7 dias / total, em %. */
  taxaAtivos7d: number | null;
  taxaAtivos30d: number | null;
}

export interface ResumoEngajamento {
  todos: GrupoEngajamento;
  pagantes: GrupoEngajamento;
  emTeste: GrupoEngajamento;
  /** Pagam ou estão no teste e estão sem uso: lista para contato. */
  semUso: number;
}

function grupo(itens: ReadonlyArray<{ engajamento: EngajamentoAssinante }>): GrupoEngajamento {
  const porNivel: Record<NivelEngajamento, number> = { ativo_7d: 0, ativo_30d: 0, inativo: 0, nunca: 0 };
  for (const i of itens) porNivel[i.engajamento.nivel] += 1;
  const pct = (n: number) => (itens.length ? Math.round((n / itens.length) * 1000) / 10 : null);
  return {
    total: itens.length,
    porNivel,
    taxaAtivos7d: pct(porNivel.ativo_7d),
    taxaAtivos30d: pct(porNivel.ativo_7d + porNivel.ativo_30d),
  };
}

export function resumirEngajamento(
  assinantes: ReadonlyArray<{ situacao: { codigo: CodigoSituacaoAssinante }; engajamento: EngajamentoAssinante }>,
): ResumoEngajamento {
  return {
    todos: grupo(assinantes),
    // Quem cancelou ainda paga o período: entra com os pagantes.
    pagantes: grupo(assinantes.filter((a) => a.situacao.codigo === 'pago' || a.situacao.codigo === 'cancelamento_agendado')),
    emTeste: grupo(assinantes.filter((a) => a.situacao.codigo === 'em_teste' || a.situacao.codigo === 'teste_tolerancia')),
    semUso: assinantes.filter((a) => semUsoComRisco(a.situacao.codigo, a.engajamento)).length,
  };
}

/** Do mais tempo sem uso para o menos; quem nunca usou primeiro. */
export function compararSemUso(a: EngajamentoAssinante, b: EngajamentoAssinante): number {
  const da = a.diasSemUso ?? Number.POSITIVE_INFINITY;
  const db = b.diasSemUso ?? Number.POSITIVE_INFINITY;
  return db - da;
}
