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
    email?: string;
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
  checklists: MinhaObraChecklist[];
  documentos: ObraDocumento[];
  atividades: ObraAtividade[];
  ocorrencias: ObraOcorrencia[];
  financeiro: ObraFinanceiro;
  equipe: MembroEquipe[];
  localizacao?: {
    cidade: string;
    estado: string;
    bairro: string;
    rua: string;
    cep: string;
  };
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
  progresso?: number;
  bloqueioMotivo?: string;
  bloqueioInfo?: string;
  anexos?: number;
  descricao?: string;
}

export interface ChecklistItem {
  id: string;
  titulo: string;
  concluida: boolean;
}

export interface MinhaObraChecklist {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'seguranca' | 'diario' | 'etapa';
  status: 'pendente' | 'completo' | 'em_andamento';
  itens: ChecklistItem[];
  completadoEm?: string;
  progresso?: number;
  assinadoPor?: string;
  assinadoEm?: string;
  registroProfissional?: string;
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
  fase?: 'antes' | 'durante' | 'agora';
  enviadaAoContratante?: boolean;
}

export interface ObraDocumento {
  id: string;
  nome: string;
  categoria: 'contrato' | 'art_rrt' | 'planta' | 'relatorio' | 'alvara' | 'laudo' | 'foto' | 'outros';
  tamanho?: string;
  data: string;
  status?: 'assinado' | 'valido' | 'vencendo' | 'novo';
  venceEmDias?: number;
  observacoes?: string;
  url?: string;
}

export interface ObraAtividade {
  id: string;
  nome: string;
  responsavel: string;
  inicio: string;
  fim: string;
  progresso: number;
  status: 'concluido' | 'em_andamento' | 'atrasado' | 'pendente';
  descricao?: string;
}

export interface ObraOcorrencia {
  id: string;
  titulo: string;
  descricao: string;
  severidade: 'critico' | 'medio' | 'baixo';
  status: 'aberto' | 'resolvido';
  responsavel: string;
  dataAbertura: string;
  prazo?: string;
  resolvidoEm?: string;
  resolvidoPor?: string;
  observacoesResolucao?: string;
  fotoUrl?: string;
}

export interface ObraMedicao {
  id: string;
  numero: number;
  data: string;
  valor: number;
  status: 'aprovada' | 'aguardando' | 'rejeitada';
}

export interface ObraFinanceiro {
  valorContratado: number;
  aditivos: number;
  valorTotal: number;
  saldoReceber: number;
  percentualRecebido: number;
  percentualExecutado: number;
  medicoes: ObraMedicao[];
}

export interface MembroEquipe {
  id: string;
  nome: string;
  iniciais: string;
  cor: string;
  papel: string;
  tipo: 'contratante' | 'engenheiro' | 'mestre' | 'equipe';
  telefone?: string;
  email?: string;
  registro?: string;
  ativo?: boolean;
  membros?: string;
  permissao?: 'visualizar' | 'editar' | 'admin';
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
