export type EntradaCategoria = 'medicao' | 'assinatura' | 'taxa' | 'multa' | 'outros';

export interface Entrada {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: EntradaCategoria;
  cliente: string;
  obra?: string;
  status: 'confirmado' | 'pendente' | 'cancelado';
  comprovante?: string;
}

export interface EntradaResumo {
  totalMes: number;
  totalConfirmado: number;
  totalPendente: number;
  crescimentoMes: number;
}
