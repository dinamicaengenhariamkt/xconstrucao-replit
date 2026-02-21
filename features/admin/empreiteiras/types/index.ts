export type EmpreiteiraStatus = 'ativa' | 'inativa' | 'suspensa' | 'pendente';

export interface AdminEmpreiteira {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  responsavel: string;
  status: EmpreiteiraStatus;
  avatarUrl?: string;
  dataCadastro: string;
  endereco: string;
  cidade: string;
  estado: string;
  especialidades: string[];
  nota: number;
  totalObras: number;
  obrasEmAndamento: number;
  valorTotalContratado: number;
  valorTotalRecebido: number;
}

export interface AdminEmpreiteiraObra {
  id: string;
  nome: string;
  codigo: string;
  cliente: string;
  status: 'em_andamento' | 'concluida' | 'pausada' | 'cancelada';
  valorContratado: number;
  percentConcluido: number;
  dataInicio: string;
  previsaoFim: string;
}
