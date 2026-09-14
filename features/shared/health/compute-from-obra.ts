import { calculateHealth, type HealthDetalhes } from './calculate';
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
 *  - tarefas:    execução creditada (concluídas + em andamento) sobre o total,
 *    com penalidade por problemas abertos. Neutro (100) enquanto o plano só foi
 *    cadastrado e nada começou — planejar não é sintoma (XG15).
 */
export interface HealthObraInput {
  progresso: number;
  diasAtraso: number;
  problemasAbertos: number;
  /**
   * Tudo que não está concluído — inclui o que está em execução. Mantido para
   * os chamadores que só têm este número; prefira informar `tarefasEmAndamento`
   * junto, senão trabalho em curso é lido como pendência (ver o fator abaixo).
   */
  tarefasPendentes: number;
  /**
   * XG15 — o que está em execução. A XG10 separou este contador para o KPI
   * ("eu tô executando, ele coloca como tarefa pendente", 25:39) mas o score
   * continuou somando tudo em `tarefasPendentes`: uma obra no prazo com uma
   * única tarefa em andamento caía em "Risco". É o relato de 11:42 da mesma
   * reunião, sobrevivendo no cálculo.
   */
  tarefasEmAndamento?: number;
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

/**
 * Quanto uma tarefa em execução vale, de 0 a 1, no fator de tarefas.
 * Ver a justificativa do valor no cálculo, mais abaixo.
 */
const PESO_EM_ANDAMENTO = 0.7;

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

  /**
   * XG15 — o fator de tarefas passou a distinguir três coisas que antes eram
   * uma só ("não concluída"):
   *
   *  - concluída  → crédito integral;
   *  - em andamento → crédito parcial (`PESO_EM_ANDAMENTO`). Trabalho em curso
   *    é avanço, não dívida: era isto que jogava obra no prazo para "Risco";
   *  - nem iniciada → sem crédito, mas só depois que a obra começou (abaixo).
   *
   * O peso 0,7 foi escolhido por simulação: mantém "Saudável" quem está
   * tocando a obra e preserva "Risco" para quem tem metade do plano parado —
   * se fosse 1,0, o fator viraria enfeite e deixaria de sinalizar qualquer coisa.
   */
  const emAndamento = Math.min(
    obra.tarefasEmAndamento ?? 0,
    Math.max(0, obra.tarefasPendentes),
  );
  const concluidas = Math.max(0, obra.tarefasTotal - obra.tarefasPendentes);
  const naoIniciadas = Math.max(0, obra.tarefasTotal - concluidas - emAndamento);

  let tarefas: number;
  if (obra.tarefasTotal === 0) {
    // Sem tarefa cadastrada não há execução a medir; só ocorrência pesa.
    tarefas = obra.problemasAbertos > 0 ? clamp(70 - obra.problemasAbertos * 10) : 100;
  } else if (concluidas === 0 && emAndamento === 0 && obra.problemasAbertos === 0) {
    /**
     * O plano foi cadastrado e nada começou: neutro, pelo mesmo princípio que a
     * XG10 aplicou ao financeiro ("sem contrato lançado não há o que medir").
     * Antes, cadastrar 8 tarefas derrubava a obra de "Saudável 100" para
     * "Risco 75" — o produto punia justamente quem planejava.
     */
    tarefas = 100;
  } else {
    const credito = (concluidas + emAndamento * PESO_EM_ANDAMENTO) / obra.tarefasTotal;
    tarefas = clamp(credito * 100 - obra.problemasAbertos * 8);
  }

  const iso =
    obra.updatedAt instanceof Date
      ? obra.updatedAt.toISOString()
      : typeof obra.updatedAt === 'string'
        ? obra.updatedAt
        : new Date().toISOString();

  /**
   * XG15 — o motivo diz o número e o que fazer. O template genérico ("Muitas
   * tarefas pendentes ou bloqueadas") não ajuda quem está no canteiro a decidir
   * nada, e chegava a mentir: aparecia em obra sem nada bloqueado.
   */
  const plural = (n: number, um: string, muitos: string) => (n === 1 ? um : muitos);
  const detalhes: HealthDetalhes = {};
  if (obra.problemasAbertos > 0 && naoIniciadas > 0) {
    detalhes.tarefas =
      `${obra.problemasAbertos} ${plural(obra.problemasAbertos, 'problema em aberto', 'problemas em aberto')}` +
      ` e ${naoIniciadas} ${plural(naoIniciadas, 'tarefa ainda não iniciada', 'tarefas ainda não iniciadas')}`;
  } else if (obra.problemasAbertos > 0) {
    detalhes.tarefas = `${obra.problemasAbertos} ${plural(obra.problemasAbertos, 'problema em aberto', 'problemas em aberto')} — resolva para liberar o indicador`;
  } else if (naoIniciadas > 0) {
    detalhes.tarefas = `${naoIniciadas} ${plural(naoIniciadas, 'tarefa ainda não foi iniciada', 'tarefas ainda não foram iniciadas')}`;
  }
  if (obra.diasAtraso > 0) {
    detalhes.atraso = `${obra.diasAtraso} ${plural(obra.diasAtraso, 'dia', 'dias')} além da data prevista`;
  }

  return calculateHealth({ atraso, financeiro, tarefas }, iso, detalhes);
}
