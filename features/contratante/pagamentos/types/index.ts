export interface PagamentoContratante {
  id: string;
  descricao: string;
  obraId: string;
  obraNome: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  data: string;
  status: 'pago' | 'pendente' | 'atrasado' | 'agendado';
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
