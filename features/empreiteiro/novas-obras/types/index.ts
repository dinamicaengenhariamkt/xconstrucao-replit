import type { ObraComplexidade, ApplicationStatus, FilterChipOption } from '@features/shared/types';

export type NovaObraStatus =
  | 'recebendo_propostas'
  | 'analise_final'
  | 'urgente'
  | 'encerrando';

export interface NovaObra {
  id: string;
  titulo: string;
  endereco: string;
  imagemUrl: string;
  tipo: string;
  complexidade: ObraComplexidade;
  status: NovaObraStatus;
  orcamento: number;
  prazo: string;
  descricao: string;
  contratante: {
    nome: string;
    iniciais: string;
    cor: string;
    email?: string;
  };
  destaque: boolean;
  applicationStatus: ApplicationStatus;
  dataPublicacao: string;
  candidaturas: number;
  materiaisPor?: 'contratante' | 'empreiteiro' | 'misto';
}

export interface Pendencia {
  id: string;
  titulo: string;
  descricao: string;
  resolvido: boolean;
}

export interface MotivoVolumeObras {
  tipo: 'volume_obras';
  atual: number;
  limite: number;
}

export interface MotivoAtrasos {
  tipo: 'atrasos';
  obras: { nome: string; diasAtraso: number }[];
}

export interface MotivoScore {
  tipo: 'score';
  atual: number;
  minimo: number;
}

export type MotivoBloqueio = MotivoVolumeObras | MotivoAtrasos | MotivoScore;

export interface PerfilStatus {
  isBlocked: boolean;
  completionPercentage: number;
  pendencias: Pendencia[];
  motivoBloqueio: string;
  motivosBloqueio?: MotivoBloqueio[];
}

export interface NovaObraCardProps {
  obra: NovaObra;
  isBlocked?: boolean;
}

export interface NovasObrasGridProps {
  obras: NovaObra[];
  isBlocked?: boolean;
}

export interface BlockedBannerProps {
  perfilStatus: PerfilStatus;
}

export interface ObraEtapa {
  id: string;
  nome: string;
  descricao: string;
  prazo: string;
  icone?: string;
  status: 'pendente' | 'em_andamento' | 'concluida';
}

export interface SinapiBreakdown {
  etapa: string;
  valor: number;
}

export interface SinapiData {
  custoPorM2: number;
  referenciaMes: string;
  regiao: string;
  statusVsSinapi: 'acima' | 'dentro' | 'abaixo';
  breakdown: SinapiBreakdown[];
}

export interface ObraDocumento {
  id: string;
  nome: string;
  tipo: string;
  tamanho: string;
  url: string;
}

export interface ObraDetalhe extends NovaObra {
  areaTotal: string;
  tipoObra: string;
  inicioPrevisto?: string;
  situacaoProjeto?: string;
  observacoes?: string;
  localizacao: {
    cidade: string;
    estado: string;
    bairro: string;
    rua?: string;
    cep?: string;
  };
  sinapi?: SinapiData;
  etapas: ObraEtapa[];
  documentos: ObraDocumento[];
  requisitos: string[];
}

export interface ObraDetalheHeroProps {
  obra: ObraDetalhe;
}

export interface ObraDetalheSidebarProps {
  obra: ObraDetalhe;
  onApply: () => void;
  isApplying: boolean;
}
