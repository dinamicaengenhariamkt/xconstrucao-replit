import type { HistoricoBloqueio } from '@features/admin/shared/types/historico-bloqueio';

// Vocabulário canônico do banco usa 'ativo'/'inativo'/'aprovacao';
// 'ativa'/'inativa'/'suspensa'/'pendente' permanecem como aliases legados
// usados nos mocks da admin UI.
export type EmpreiteiraStatus =
  | 'ativo'
  | 'inativo'
  | 'aprovacao'
  | 'ativa'
  | 'inativa'
  | 'suspensa'
  | 'pendente';

export type { HistoricoBloqueio };

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
  obrasConcluidas?: number;
  valorTotalContratado: number;
  valorTotalRecebido: number;
  // Dados cadastrais adicionais
  inscricaoEstadual?: string;
  bairro?: string;
  cep?: string;
  site?: string;
  observacoes?: string;
  // Responsável técnico
  responsavelEmail?: string;
  responsavelTelefone?: string;
  responsavelRegistro?: string;
  responsavelProfissao?: string;
  /** Histórico de bloqueios e desbloqueios da conta. */
  historicoBloqueios?: HistoricoBloqueio[];
}

export interface AdminEmpreiteiraObra {
  id: string;
  nome: string;
  codigo: string;
  cliente: string;
  status: 'em_andamento' | 'em_proposta' | 'concluida' | 'pausada' | 'cancelada' | 'atrasada';
  valorContratado: number;
  percentConcluido: number;
  dataInicio: string;
  previsaoFim: string;
}
