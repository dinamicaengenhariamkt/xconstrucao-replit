/**
 * Adapters DB → UI shapes para obras.
 * Usado por contratante/empreiteiro/admin para mapear linhas do DB
 * (shape de `obras` em shared/db/schema.ts) para os tipos esperados
 * pelos componentes de listagem/detalhe já existentes.
 *
 * Campos ricos que não existem no schema (etapas, timeline, equipe,
 * fotos, sinapi, etc.) ficam como arrays/objetos vazios; os componentes
 * tratam estados vazios graciosamente.
 */
import type {
  ObraContratante,
  ObraContratanteDetalhe,
} from '@features/contratante/minhas-obras/types';
import type {
  NovaObra,
  ObraDetalhe,
} from '@features/empreiteiro/novas-obras/types';
import type {
  ObraStatus,
  ObraComplexidade,
} from '@features/shared/types';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200';

export type DbObra = {
  id: string;
  nome: string;
  endereco: string;
  clienteId?: string | null;
  empreiteiraId?: string | null;
  status: 'em_andamento' | 'concluida' | 'pausada' | 'planejamento';
  visibilidade: 'rascunho' | 'publicada' | 'pausada' | 'arquivada';
  tipo?: string | null;
  descricao?: string | null;
  cep?: string | null;
  cidade?: string | null;
  uf?: string | null;
  modalidade?: 'administracao' | 'empreitada_global' | 'empreitada_etapa' | null;
  materiaisPor?: 'contratante' | 'empreiteiro' | 'misto' | null;
  areaM2?: string | null;
  padraoAcabamento?: string | null;
  valorTotal?: string | null;
  valorPago?: string | null;
  progresso?: number | null;
  dataInicio?: string | null;
  dataPrevisao?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

export type DbObraAnexo = {
  id: string;
  tipo: string;
  observacao?: string | null;
  createdAt?: string | Date | null;
  fileId?: string;
  originalName?: string | null;
  mime?: string | null;
  sizeBytes?: number | null;
  url?: string | null;
};

/** Mapeia status do schema → ObraStatus usado pela UI do contratante. */
export function mapDbStatusToContratante(s: DbObra['status']): ObraStatus {
  switch (s) {
    case 'em_andamento': return 'em_execucao';
    case 'concluida': return 'finalizada';
    case 'pausada': return 'com_pendencias';
    case 'planejamento': return 'planejamento';
    default: return 'planejamento';
  }
}

/** Mapeia `obra_anexo_tipo` (DB) → categoria usada por `TabDocumentos` na UI. */
export type UiDocumentoCategoria =
  | 'contrato' | 'art_rrt' | 'planta' | 'relatorio'
  | 'alvara' | 'laudo' | 'foto' | 'outros';

export function mapAnexoTipoToCategoria(tipo: string): UiDocumentoCategoria {
  switch (tipo) {
    case 'contrato': return 'contrato';
    case 'art_rrt': return 'art_rrt';
    case 'alvara': return 'alvara';
    case 'projeto_arquitetonico':
    case 'projeto_estrutural': return 'planta';
    case 'foto_local': return 'foto';
    case 'outros':
    default: return 'outros';
  }
}

export const VISIBILIDADE_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  pausada: 'Pausada',
  arquivada: 'Arquivada',
};

export const VISIBILIDADE_BADGE_CLASSES: Record<string, string> = {
  rascunho: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  publicada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  arquivada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function toNumber(v: string | null | undefined, fallback = 0): number {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return '—';
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'Hoje';
  if (days === 1) return 'Ontem';
  if (days < 30) return `Há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
  return d.toLocaleDateString('pt-BR');
}

function fullEndereco(o: DbObra): string {
  const partes = [o.endereco, o.cidade, o.uf].filter(Boolean);
  return partes.join(' - ') || o.endereco || '—';
}

/** DB row → ObraContratante (para grid de minhas-obras do contratante). */
export function dbToObraContratante(o: DbObra): ObraContratante & {
  visibilidade: DbObra['visibilidade'];
} {
  const semEmpreiteira = !o.empreiteiraId;
  return {
    id: o.id,
    titulo: o.nome,
    endereco: fullEndereco(o),
    imagemUrl: DEFAULT_IMG,
    status: mapDbStatusToContratante(o.status),
    progresso: o.progresso ?? 0,
    orcamento: toNumber(o.valorTotal),
    dataInicio: o.dataInicio ?? '—',
    dataPrevisaoFim: o.dataPrevisao ?? '—',
    empreiteiro: semEmpreiteira
      ? { nome: 'Aguardando', iniciais: 'AG', cor: 'bg-gray-400' }
      : { nome: 'Empreiteira contratada', iniciais: 'EC', cor: 'bg-primary' },
    tipo: o.tipo ?? '—',
    candidaturas: 0,
    visibilidade: o.visibilidade,
  };
}

/** DB row (+ anexos) → ObraContratanteDetalhe (página de detalhe). */
export function dbToObraContratanteDetalhe(
  o: DbObra,
  anexos: DbObraAnexo[] = [],
): ObraContratanteDetalhe & { visibilidade: DbObra['visibilidade'] } {
  const base = dbToObraContratante(o);
  const orcamento = base.orcamento;
  const valorPago = toNumber(o.valorPago);
  const valorRestante = Math.max(0, orcamento - valorPago);
  const documentos = anexos.map((a) => ({
    id: a.id,
    nome: a.originalName || a.tipo,
    categoria: mapAnexoTipoToCategoria(a.tipo),
    tamanho: a.sizeBytes ? `${(a.sizeBytes / 1024 / 1024).toFixed(1)} MB` : undefined,
    data: a.createdAt ? new Date(a.createdAt).toLocaleDateString('pt-BR') : '—',
    url: a.url ?? undefined,
    observacoes: a.observacao ?? undefined,
  }));

  return {
    ...base,
    descricao: o.descricao ?? '',
    valorPago,
    valorRestante,
    diasRestantes: 0,
    tarefasConcluidas: 0,
    tarefasTotal: 0,
    etapas: [],
    tarefas: [],
    timeline: [],
    ocorrencias: [],
    equipe: [],
    financeiro: {
      valorContratado: orcamento,
      aditivos: 0,
      valorTotal: orcamento,
      valorPago,
      medicoes: [],
    },
    fotos: [],
    documentos,
    checklists: [],
    localizacao: {
      cidade: o.cidade ?? '',
      estado: o.uf ?? '',
      bairro: '',
      rua: o.endereco ?? '',
      cep: o.cep ?? '',
    },
    candidaturasLista: [],
  };
}

function mapComplexidade(o: DbObra): ObraComplexidade {
  const v = toNumber(o.valorTotal);
  if (v >= 1_500_000) return 'alta';
  if (v >= 400_000) return 'media';
  return 'baixa';
}

/** DB row → NovaObra (para grid de novas-obras do empreiteiro). */
export function dbToNovaObra(o: DbObra): NovaObra {
  return {
    id: o.id,
    titulo: o.nome,
    endereco: fullEndereco(o),
    imagemUrl: DEFAULT_IMG,
    tipo: o.tipo ?? 'Geral',
    complexidade: mapComplexidade(o),
    status: 'recebendo_propostas',
    orcamento: toNumber(o.valorTotal),
    prazo: o.dataPrevisao ?? '—',
    descricao: o.descricao ?? '',
    contratante: { nome: 'Contratante', iniciais: 'CT', cor: 'bg-primary' },
    destaque: false,
    applicationStatus: 'nao_aplicado',
    dataPublicacao: formatRelative(o.createdAt ?? null),
    candidaturas: 0,
    materiaisPor: o.materiaisPor ?? undefined,
  };
}

/** DB row → ObraDetalhe (página de detalhe do empreiteiro). */
export function dbToObraDetalheEmpreiteiro(
  o: DbObra,
  anexos: DbObraAnexo[] = [],
): ObraDetalhe {
  const base = dbToNovaObra(o);
  const area = o.areaM2 ? `${o.areaM2} m²` : '—';
  const documentos = anexos.map((a) => ({
    id: a.id,
    nome: a.originalName || a.tipo,
    tipo: a.tipo,
    tamanho: a.sizeBytes ? `${(a.sizeBytes / 1024 / 1024).toFixed(1)} MB` : '—',
    url: a.url ?? '',
  }));
  return {
    ...base,
    areaTotal: area,
    tipoObra: o.tipo ?? '—',
    inicioPrevisto: o.dataInicio ?? undefined,
    situacaoProjeto: undefined,
    observacoes: o.descricao ?? undefined,
    localizacao: {
      cidade: o.cidade ?? '—',
      estado: o.uf ?? '—',
      bairro: '',
      rua: o.endereco ?? undefined,
      cep: o.cep ?? undefined,
    },
    etapas: [],
    documentos,
    requisitos: [],
  };
}
