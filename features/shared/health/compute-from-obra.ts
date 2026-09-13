import { calculateHealth } from './calculate';
import type { ObraHealth } from './types';

/**
 * Computa a saúde da obra a partir de dados reais já carregados em
 * `MinhaObraDetalhe` (substitui o mock determinístico `getMockHealth`).
 *
 * Heurísticas (cada fator é 0..100, onde 100 = saudável):
 *  - atraso:     começa em 100, perde 4 pontos por dia de atraso.
 *  - financeiro: relação valorPago / valorContratado vs. progresso (quanto
 *    mais o pagamento acompanha a execução, mais saudável). Neutro (100)
 *    quando a obra não tem contrato nem pagamento lançado — sem dado, não há
 *    desalinhamento a apontar (XG10).
 *  - tarefas:    proporção (total - pendentes) / total + penalidade por
 *    problemas abertos; cai pra 50 se não há dados de tarefas mas há
 *    ocorrências abertas; vai a 100 quando não há nada pra fazer.
 */
export interface HealthObraInput {
  progresso: number;
  diasAtraso: number;
  problemasAbertos: number;
  tarefasPendentes: number;
  tarefasTotal: number;
  financeiro: {
    valorContratado: number;
    valorTotal: number;
    saldoReceber: number;
    /** XG10 — lançamentos reais, quando o chamador os tem (detalhe da obra). */
    receitaTotal?: number;
    custoTotal?: number;
  };
  valorPago: number;
  updatedAt?: string | Date | null;
  /**
   * XG10 — a obra tem contrato e pagamento a acompanhar? Quando não há valor
   * contratado nem nada recebido, comparar execução com pagamento não mede
   * nada: o fator vira neutro em vez de punir.
   */
  temDadoFinanceiro?: boolean;
}

function clamp(n: number) {
  return Math.min(100, Math.max(0, n));
}

export function computeHealthFromObra(obra: HealthObraInput): ObraHealth {
  const atraso = clamp(100 - obra.diasAtraso * 4);

  const total = obra.financeiro.valorTotal || obra.financeiro.valorContratado || 0;

  // XG10 — sem contrato lançado nem pagamento registrado, não há o que medir.
  // Antes, `pagoRatio` ficava 0 e QUALQUER progresso virava gap: 34% de avanço
  // já derrubava o fator abaixo de 60 e a obra aparecia em "atenção"/"risco"
  // recém-criada — o "comecei só pra encher e o negócio já está dando risco"
  // (11:42) da reunião. Neutro (100) é a leitura honesta de "nada a apontar".
  const temDadoFinanceiro =
    obra.temDadoFinanceiro ??
    (total > 0 ||
      obra.valorPago > 0 ||
      (obra.financeiro.receitaTotal ?? 0) > 0 ||
      (obra.financeiro.custoTotal ?? 0) > 0);

  let financeiro: number;
  if (!temDadoFinanceiro) {
    financeiro = 100;
  } else {
    const pagoRatio = total > 0 ? Math.min(1, obra.valorPago / total) : 0;
    const progRatio = Math.min(1, (obra.progresso || 0) / 100);
    // Saudável quando pagamento acompanha execução (gap baixo).
    const gap = Math.abs(progRatio - pagoRatio);
    financeiro = clamp(100 - gap * 120);
  }

  let tarefas: number;
  if (obra.tarefasTotal > 0) {
    const concluidas = Math.max(0, obra.tarefasTotal - obra.tarefasPendentes);
    tarefas = clamp((concluidas / obra.tarefasTotal) * 100 - obra.problemasAbertos * 8);
  } else if (obra.problemasAbertos > 0) {
    tarefas = clamp(70 - obra.problemasAbertos * 10);
  } else {
    tarefas = 100;
  }

  const iso =
    obra.updatedAt instanceof Date
      ? obra.updatedAt.toISOString()
      : typeof obra.updatedAt === 'string'
        ? obra.updatedAt
        : new Date().toISOString();
  return calculateHealth({ atraso, financeiro, tarefas }, iso);
}
