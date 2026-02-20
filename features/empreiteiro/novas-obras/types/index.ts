import type { ObraComplexidade, ApplicationStatus, FilterChipOption } from '@features/shared/types';

export interface NovaObra {
  id: string;
  titulo: string;
  endereco: string;
  imagemUrl: string;
  tipo: string;
  complexidade: ObraComplexidade;
  orcamento: number;
  prazo: string;
  descricao: string;
  contratante: {
    nome: string;
    iniciais: string;
    cor: string;
  };
  destaque: boolean;
  applicationStatus: ApplicationStatus;
  dataPublicacao: string;
  candidaturas: number;
}

export interface Pendencia {
  id: string;
  titulo: string;
  descricao: string;
  resolvido: boolean;
}

export interface PerfilStatus {
  isBlocked: boolean;
  completionPercentage: number;
  pendencias: Pendencia[];
  motivoBloqueio: string;
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
  status: 'pendente' | 'em_andamento' | 'concluida';
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
  etapas: ObraEtapa[];
  documentos: ObraDocumento[];
  requisitos: string[];
  localizacao: {
    cidade: string;
    estado: string;
    bairro: string;
  };
}

export interface ObraDetalheHeroProps {
  obra: ObraDetalhe;
}

export interface ObraDetalheSidebarProps {
  obra: ObraDetalhe;
  onApply: () => void;
  isApplying: boolean;
}
