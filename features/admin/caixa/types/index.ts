export interface CaixaResumo {
  saldoAtual: number;
  entradasMes: number;
  saidasMes: number;
  previsaoProximoMes: number;
}

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

export type CaixaPeriodo = '7dias' | '30dias' | '3meses';
