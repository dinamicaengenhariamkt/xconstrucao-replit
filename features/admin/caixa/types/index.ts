import type { IconType } from 'react-icons';

// ─── Período ─────────────────────────────────────────────────────────────────

export type CaixaPeriodo = '7dias' | '30dias' | '90dias' | 'anoAtual' | 'personalizado';
export type CaixaPeriodoMacro = CaixaPeriodo | 'futuro';

export interface PeriodoOption<T extends string = CaixaPeriodo> {
  value: T;
  label: string;
  icon?: IconType;
}

// ─── Resumo / KPI ─────────────────────────────────────────────────────────────

/** Dados brutos do caixa (usado pelo resumo existente) */
export interface CaixaResumo {
  saldoAtual: number;
  entradasMes: number;
  saidasMes: number;
  previsaoProximoMes: number;
}

/** Dados dos 6 cards KPI principais */
export interface CaixaKpiData {
  saldoDisponivel: number;
  entradasPeriodo: number;
  saidasPeriodo: number;
  resultadoPeriodo: number;
  saldoProjetado: number;
  diasCaixa: number;
  /** Badge extra por card (badges de variação) */
  entradasVariacao: string;
  saidasVariacao: string;
  resultadoLabel: string;
  saldoProjetadoLabel: string;
  diasCaixaLabel: string;
  saldoAtualizadoEm: string;
}

// ─── Movimentações ────────────────────────────────────────────────────────────

export type MovimentacaoTipo = 'entrada' | 'saida';

export interface Movimentacao {
  id: string;
  tipo: MovimentacaoTipo;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  referencia: string;
  status: 'confirmado' | 'pendente' | 'cancelado';
}

// ─── Indicadores Econômicos ───────────────────────────────────────────────────

export interface IndiceEconomico {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  badgeLabel: string;
  badgeClass: string;
  iconBgClass: string;
  iconColorClass: string;
  hoverBorderClass: string;
  sparklineColor: string;
  sparklinePath: string;
  icon: IconType;
}

// ─── Framework de Impacto ─────────────────────────────────────────────────────

export interface ImpactoItem {
  id: string;
  icon: IconType;
  bgClass: string;
  iconBgClass: string;
  iconColorClass: string;
  label: string;
  value: string;
  valueClass: string;
  detail: string;
}

// ─── Gráfico Saldo no Tempo ───────────────────────────────────────────────────

export interface CaixaChartPoint {
  dia: string;
  saldo?: number;
  projecao?: number;
}

// ─── Resumo de Fluxo ─────────────────────────────────────────────────────────

export interface FluxoItem {
  id: string;
  icon: IconType;
  bgClass: string;
  iconBgClass: string;
  iconColorClass: string;
  label: string;
  value: string;
  valueClass: string;
}
