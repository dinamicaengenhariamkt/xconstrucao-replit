export type SaidaCategoria = 'pagamento_empreiteira' | 'material' | 'operacional' | 'impostos' | 'outros';

export interface Saida {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: SaidaCategoria;
  fornecedor: string;
  obra?: string;
  status: 'pago' | 'pendente' | 'agendado';
  notaFiscal?: string;
}

export interface SaidaResumo {
  totalMes: number;
  totalPago: number;
  totalPendente: number;
  totalAgendado: number;
}
