export type SaidaPeriodo = '7dias' | '30dias' | '3meses' | '12meses' | 'personalizado';

export interface DateRange {
  from: Date;
  to?: Date;
}

export type SaidaTipo = 'pagamento_medicao' | 'reembolso' | 'custo_operacional';
export type SaidaDestinoPerfil = 'empreiteira' | 'cliente' | 'outro';
export type SaidaStatus = 'pago' | 'agendado' | 'pendente_aprovacao' | 'atrasado';

export interface Saida {
  id: string;
  dataHora: string; // ISO: '2024-06-26T14:30:00'
  descricao: string;
  obra?: string;
  local?: string; // ex: 'Campinas/SP'
  destino: string; // nome da entidade
  destinoPerfil: SaidaDestinoPerfil;
  tipoSaida: SaidaTipo;
  status: SaidaStatus;
  valor: number;
}

export interface SaidaKpi {
  totalSaidas: number;
  crescimentoPercent: number;
  pagamentosEmpreiteiras: number;
  pagamentosEmpreiteirasPercent: number;
  reembolsos: number;
  reembolsosPercent: number;
  outrosDesembolsos: number;
  outrosDesembolsosPercent: number;
  saidasPrevistas: number;
  maiorPagamento: number;
  maiorPagamentoDescricao: string;
}

export interface SaidaChartPoint {
  dia: string;
  pagamentos: number;
  reembolsos: number;
  outros: number;
}

export interface SaidaInsight {
  maiorDia: string;
  maiorDiaValor: number;
  diasSemSaida: number;
}

export interface SaidaChartData {
  chart: SaidaChartPoint[];
  insights: SaidaInsight;
}

export interface SaidaFutura {
  id: string;
  vencimento: string; // ISO date: '2024-07-05'
  descricao: string;
  destino: string;
  destinoPerfil: SaidaDestinoPerfil;
  obra?: string;
  tipoSaida: SaidaTipo;
  valor: number;
}
