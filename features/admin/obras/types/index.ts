import type { AdminClienteObra } from '@features/admin/clientes/types';

export interface AdminObraDetalhe extends AdminClienteObra {
  cliente: string;
  tipo: string;
  endereco: string;
  valorPago: number;
  aditivos: number;
  valorTotal: number;
  medicoes: AdminObraMedicao[];
  historico: AdminObraHistoricoItem[];
}

export type ObraMedicaoStatus = 'pago' | 'pendente' | 'atrasado' | 'em_analise';

export interface AdminObraMedicao {
  id: string;
  numero: number;
  periodo: string;
  valorMedicao: number;
  valorPago: number;
  status: ObraMedicaoStatus;
  dataVencimento: string;
  dataPagamento?: string;
}

export interface AdminObraHistoricoItem {
  id: string;
  tipo: 'pagamento' | 'medicao' | 'aditivo' | 'alerta' | 'nota';
  titulo: string;
  descricao: string;
  valor?: number;
  data: string;
}
