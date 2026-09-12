import type { ObraStatusDb } from '@shared/constants/status';
import type { SecoesPublicas } from './secoes';

export interface ObraPublicaTarefa {
  id: string;
  titulo: string;
  descricao: string | null;
  etapa: string;
  status: 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';
  prazo: string | null;
  progresso: number | null;
}

export interface ObraPublicaEtapa {
  id: string;
  nome: string;
  descricao: string | null;
  progresso: number;
  status: 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';
}

export interface ObraPublicaDiario {
  id: string;
  texto: string;
  createdAt: string;
  fotos: string[];
}

export interface ObraPublicaOcorrencia {
  id: string;
  titulo: string;
  descricao: string;
  gravidade: 'critico' | 'medio' | 'baixo';
  status: 'aberta' | 'resolvida';
  fotoUrl: string | null;
  resolvidoEm?: string;
  createdAt: string;
}

export interface ObraPublicaFoto {
  id: string;
  url: string;
  fase: 'antes' | 'durante' | 'agora' | null;
  tag: string | null;
  createdAt: string;
}

export interface ObraPublicaAtualizacao {
  id: string;
  etapa: string;
  descricao: string | null;
  percentual: number;
  createdAt: string;
  fotosCount: number;
}

export interface ObraPublicaChecklist {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'seguranca' | 'diario' | 'etapa';
  status: 'pendente' | 'completo' | 'em_andamento';
  itens: Array<{ id: string; titulo: string; concluida: boolean }>;
  completadoEm?: string;
}

/**
 * Contrato mínimo e deliberadamente anônimo do conteúdo compartilhável.
 * Não acrescente finanças, contato, identificadores pessoais ou chaves de
 * armazenamento. URLs de mídia já são capabilities temporárias resolvidas no
 * servidor apenas após validar o link da obra.
 */
export interface ObraPublicaView {
  obra: {
    id: string;
    titulo: string;
    tipo: string | null;
    descricao: string | null;
    areaM2: string | null;
    /**
     * Enum `obra_status` do banco, não o status derivado da UI do marketplace.
     * Tipar estreito é o que impede aplicar o dicionário errado na renderização.
     */
    status: ObraStatusDb;
    progresso: number;
    cidade: string | null;
    uf: string | null;
    /**
     * Rua, apenas quando o dono liga a seção de localização. Os demais campos
     * de endereço e as coordenadas não existem neste contrato — nem como campo
     * opcional, para que não haja onde preenchê-los por engano.
     */
    logradouro: string | null;
    dataInicio: string | null;
    dataPrevisao: string | null;
    imagemUrl: string | null;
    ultimaAtualizacao: string | null;
  };
  etapas: ObraPublicaEtapa[];
  diario: ObraPublicaDiario[];
  ocorrencias: ObraPublicaOcorrencia[];
  fotos: ObraPublicaFoto[];
  atualizacoes: ObraPublicaAtualizacao[];
  checklists: ObraPublicaChecklist[];
  tarefas: ObraPublicaTarefa[];
  /** O que este link expõe; o shell usa para montar só as abas liberadas. */
  secoes: SecoesPublicas;
}