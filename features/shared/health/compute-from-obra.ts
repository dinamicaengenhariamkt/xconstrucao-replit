import { calculateHealth } from './calculate';
import type { ObraHealth } from './types';

/**
 * Computa a saúde da obra a partir de dados reais já carregados em
 * `MinhaObraDetalhe` (substitui o mock determinístico `getMockHealth`).
 *
 * Heurísticas (cada fator é 0..100, onde 100 = saudável):
 *  - atraso:     começa em 100, perde 4 pontos por dia de atraso.
 *  - financeiro: relação valorPago / valorContratado vs. progresso (quanto
 *    mais o pagamento acompanha a execução, mais saudável).
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
  financeiro: { valorContratado: number; valorTotal: number; saldoReceber: number };
  valorPago: number;
  updatedAt?: string | Date | null;
}

function clamp(n: number) {
  return Math.min(100, Math.max(0, n));
}

export function computeHealthFromObra(obra: HealthObraInput): ObraHealth {
  const atraso = clamp(100 - obra.diasAtraso * 4);

  const total = obra.financeiro.valorTotal || obra.financeiro.valorContratado || 0;
  const pagoRatio = total > 0 ? Math.min(1, obra.valorPago / total) : 0;
  const progRatio = Math.min(1, (obra.progresso || 0) / 100);
  // Saudável quando pagamento acompanha execução (gap baixo).
  const gap = Math.abs(progRatio - pagoRatio);
  const financeiro = clamp(100 - gap * 120);

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
