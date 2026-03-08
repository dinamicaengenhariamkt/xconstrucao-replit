import type { ObraStatus, FilterChipOption } from '@features/shared/types';

export interface ObraContratante {
  id: string;
  titulo: string;
  endereco: string;
  imagemUrl: string;
  status: ObraStatus;
  progresso: number;
  orcamento: number;
  dataInicio: string;
  dataPrevisaoFim: string;
  empreiteiro: {
    nome: string;
    iniciais: string;
    cor: string;
    email?: string;
    telefone?: string;
  };
  tipo: string;
  candidaturas?: number;
}

export interface ObraContratanteDetalhe extends ObraContratante {
  descricao: string;
  valorPago: number;
  valorRestante: number;
  diasRestantes: number;
  tarefasConcluidas: number;
  tarefasTotal: number;
  etapas: EtapaObra[];
  tarefas: TarefaContratante[];
  timeline: TimelineEventContratante[];
  ocorrencias: OcorrenciaContratante[];
  equipe: MembroEquipe[];
  financeiro: RegistroFinanceiro[];
  fotos: FotoObra[];
  localizacao?: {
    cidade: string;
    estado: string;
    bairro: string;
    rua: string;
    cep: string;
  };
  candidaturasLista?: CandidaturaRecebida[];
}

export interface TarefaContratante {
  id: string;
  titulo: string;
  etapa: string;
  responsavel: string;
  prazo: string;
  status: 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';
  prioridade: 'alta' | 'media' | 'baixa';
  progresso?: number;
  bloqueioMotivo?: string;
  bloqueioInfo?: string;
  descricao?: string;
}

export interface EtapaObra {
  id: string;
  nome: string;
  progresso: number;
  tarefas: { id: string; titulo: string; concluida: boolean }[];
}

export interface MembroEquipe {
  id: string;
  nome: string;
  funcao: string;
  avatarUrl?: string;
  iniciais: string;
  cor: string;
  telefone: string;
}

export interface RegistroFinanceiro {
  id: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  data: string;
  status: 'pago' | 'pendente' | 'atrasado';
  categoria: string;
}

export interface FotoObra {
  id: string;
  url: string;
  data: string;
  etapa?: string;
  fase?: 'antes' | 'durante' | 'agora';
  tag?: string;
  enviadaAoContratante?: boolean;
}

export interface TimelineEventContratante {
  id: string;
  tipo: 'progresso' | 'tarefa' | 'documento' | 'problema' | 'nota';
  titulo: string;
  descricao: string;
  autor: string;
  data: string;
}

export interface OcorrenciaContratante {
  id: string;
  titulo: string;
  descricao: string;
  gravidade: 'critico' | 'medio' | 'baixo';
  status: 'aberta' | 'resolvida';
  responsavel: string;
  dataAbertura: string;
  dataResolucao?: string;
  resolvidoPor?: string;
  fotoUrl?: string;
}

export interface AtividadeProposta {
  id: string;
  descricao: string;
  valor: number;
  observacoes?: string;
}

export interface CandidaturaRecebida {
  id: string;
  empreiteiro: { nome: string; iniciais: string; cor: string; empresa?: string; telefone?: string; avaliacao?: number; };
  valorProposto: number;
  prazoMeses: number;
  dataEnvio: string;
  status: 'em_analise' | 'aprovado' | 'rejeitado';
  // Detalhes da proposta
  descricao?: string;
  atividades?: AtividadeProposta[];
  observacoesPrazo?: string;
  observacoesFinanceiras?: string;
  dataInicio?: string;
  dataTermino?: string;
}

export type ProgressColor = 'success' | 'warning' | 'error' | 'info' | 'primary';

export interface ObraContratanteCardProps {
  obra: ObraContratante;
}

export interface ObrasContratanteGridProps {
  obras: ObraContratante[];
}
