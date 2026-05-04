export type PagamentoStatus = 'pago' | 'pendente' | 'atrasado' | 'agendado';
export type PagamentoTipo = 'entrada' | 'saida';

export interface PagamentoContratante {
  id: string;
  descricao: string;
  obraId: string;
  obraNome: string;
  valor: number;
  tipo: PagamentoTipo;
  data: string;
  status: PagamentoStatus;
  categoria: string;
  metodoPagamento: string;
}

export interface PagamentosKPI {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  pendentes: number;
  totalContratado: number;
}
