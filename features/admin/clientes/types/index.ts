export type ClienteStatus = 'ativo' | 'inativo' | 'pendente';

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
}

export interface AdminClienteObra {
  id: string;
  nome: string;
  codigo: string;
  status: 'em_andamento' | 'concluida' | 'pausada' | 'cancelada';
  valorContratado: number;
  percentConcluido: number;
  dataInicio: string;
  previsaoFim: string;
  empreiteira: string;
}
