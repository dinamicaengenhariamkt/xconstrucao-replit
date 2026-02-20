import type { ObraStatus, FilterChipOption } from '@features/shared/types';

export interface MinhaObra {
  id: string;
  titulo: string;
  endereco: string;
  imagemUrl: string;
  status: ObraStatus;
  progresso: number;
  orcamento: number;
  dataInicio: string;
  dataPrevisaoFim: string;
  contratante: {
    nome: string;
    iniciais: string;
    cor: string;
  };
  tipo: string;
}

export interface MinhaObraDetalhe extends MinhaObra {
  valorPago: number;
  aReceber: number;
  diasAtraso: number;
  tarefasPendentes: number;
  tarefasTotal: number;
  problemasAbertos: number;
  equipeAtiva: number;
  etapas: MinhaObraEtapa[];
  tarefas: MinhaObraTarefa[];
  timeline: TimelineEvent[];
  fotos: ObraFoto[];
}

export interface MinhaObraEtapa {
  id: string;
  nome: string;
  progresso: number;
  tarefas: { id: string; titulo: string; concluida: boolean }[];
}

export interface MinhaObraTarefa {
  id: string;
  titulo: string;
  etapa: string;
  responsavel: string;
  prazo: string;
  status: 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';
  prioridade: 'alta' | 'media' | 'baixa';
}

export interface TimelineEvent {
  id: string;
  tipo: 'progresso' | 'tarefa' | 'documento' | 'problema' | 'nota';
  titulo: string;
  descricao: string;
  autor: string;
  data: string;
}

export interface ObraFoto {
  id: string;
  url: string;
  data: string;
  tag?: string;
}

export interface MinhaObraCardProps {
  obra: MinhaObra;
}

export interface MinhasObrasGridProps {
  obras: MinhaObra[];
}

export interface MinhasObrasFilterProps {
  filters: FilterChipOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}
