import type { HistoricoBloqueio } from '@features/admin/shared/types/historico-bloqueio';

export type ClienteStatus = 'ativo' | 'inativo' | 'pendente' | 'aprovacao';

export type { HistoricoBloqueio };

export interface AdminCliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpfCnpj: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  status: ClienteStatus;
  avatarUrl?: string;
  dataCadastro: string;
  endereco: string;
  cidade: string;
  estado: string;
  totalObras: number;
  valorTotalContratado: number;
  valorTotalPago: number;
  observacoes?: string;
  /** Histórico de bloqueios e desbloqueios da conta. */
  historicoBloqueios?: HistoricoBloqueio[];
}

export interface AdminClienteObra {
  id: string;
  nome: string;
  codigo: string;
  /** Espelha `obraStatusEnum` do schema (não existe 'cancelada' no banco). */
  status: 'em_andamento' | 'concluida' | 'pausada' | 'planejamento';
  valorContratado: number;
  percentConcluido: number;
  dataInicio: string;
  previsaoFim: string;
  empreiteira: string;
  localizacao?: string;
}

export type PagamentoStatus = 'pago' | 'pendente' | 'atrasado';
export type DocumentoTipo = 'pdf' | 'imagem' | 'outro';
export type AtividadeTipo =
  | 'login'
  | 'obra_atualizada'
  | 'pagamento'
  | 'documento'
  | 'obra_concluida'
  | 'nota';

export interface ClientePagamento {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  status: PagamentoStatus;
}

export interface ClienteFinanceiro {
  totalPago: number;
  saldoPendente: number;
  proximoVencimento: string | null;
  valorProximoVencimento: number | null;
  pagamentos: ClientePagamento[];
}

export interface ClienteDocumento {
  id: string;
  nome: string;
  tipo: DocumentoTipo;
  dataEnvio: string;
  url?: string;
}

export interface ClienteAtividade {
  id: string;
  tipo: AtividadeTipo;
  titulo: string;
  descricao: string;
  dataHora: string;
}
