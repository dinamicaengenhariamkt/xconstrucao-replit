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
  equipe: MembroEquipe[];
  financeiro: RegistroFinanceiro[];
  fotos: FotoObra[];
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
}

export interface ObraContratanteCardProps {
  obra: ObraContratante;
}

export interface ObrasContratanteGridProps {
  obras: ObraContratante[];
}
