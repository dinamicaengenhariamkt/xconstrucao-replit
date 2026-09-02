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
    status: string;
    progresso: number;
    cidade: string | null;
    uf: string | null;
    dataInicio: string | null;
    dataPrevisao: string | null;
    imagemUrl: string | null;
    ultimaAtualizacao: string | null;
  };
  etapas: ObraPublicaEtapa[];
  diario: ObraPublicaDiario[];
  ocorrencias: ObraPublicaOcorrencia[];
  fotos: ObraPublicaFoto[];
  checklists: ObraPublicaChecklist[];
}