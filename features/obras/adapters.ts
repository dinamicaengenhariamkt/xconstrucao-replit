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
  ObraEtapa,
} from '@features/empreiteiro/novas-obras/types';
import type {
  ObraStatus,
  ObraComplexidade,
} from '@features/shared/types';
import { formatDate } from '@shared/lib/formatters';

const DEFAULT_IMG =
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200';

/** Linha de medição retornada por GET /api/obras/[id] (campos básicos). */
export type DbMedicao = {
  id: string;
  numero: number;
  etapa: string;
  descricao?: string | null;
  percentual?: string | null;
  valor?: string | null;
  status: 'pendente' | 'aprovada' | 'contestada';
  motivoContestacao?: string | null;
  createdAt?: string | Date | null;
  decidedAt?: string | Date | null;
};

export type DbObra = {
  id: string;
  nome: string;
  endereco: string;
  clienteId?: string | null;
  empreiteiraId?: string | null;
  status: 'em_andamento' | 'concluida' | 'pausada' | 'planejamento';
  visibilidade: 'rascunho' | 'publicada' | 'pausada' | 'arquivada';
  statusModeracao?: 'pendente' | 'aprovada' | 'rejeitada' | null;
  motivoModeracao?: string | null;
  moderadoEm?: string | Date | null;
  tipo?: string | null;
  descricao?: string | null;
  cep?: string | null;
  numero?: string | null;
  complemento?: string | null;
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
  anexosCount?: number | null;
  /** Curadoria do admin (`/admin/obras-destaque`). Já vem de GET /api/obras via getTableColumns. */
  destaque?: boolean | null;
  /** Computado server-side em GET /api/obras (role=empreiteiro): intersecção da UF/cidade da obra com zona de atuação. */
  naMinhaZona?: boolean | null;
  // ── Campos agregados por GET /api/obras/[id] ──────────────────────────────
  /** Contagem de candidaturas com status 'pendente'. */
  candidaturasCount?: number | null;
  /** Medições da obra (contratante / admin). */
  medicoes?: DbMedicao[] | null;
  /** Dados básicos da empreiteira vinculada. */
  empreiteiraInfo?: {
    id?: string;
    nome?: string;
    responsavel?: string | null;
    telefone?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  /** URL pública (ou signed) da foto de capa. */
  fotoCapaUrl?: string | null;
  /** Dias restantes até dataPrevisao (calculado server-side). */
  diasRestantes?: number | null;
  /**
   * Status da candidatura DO PRÓPRIO empreiteiro logado nesta obra.
   * Só presente em GET /api/obras/[id] com role=empreiteiro — a listagem
   * (`GET /api/obras`) filtra fora obras já candidatadas (anti-self), então
   * lá o valor é sempre 'nao_aplicado' por construção.
   */
  applicationStatus?: 'nao_aplicado' | 'aplicado' | 'aceito' | 'rejeitado' | null;
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

/** Gera iniciais (até 2 letras) a partir de um nome. */
function iniciaisFromNome(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/** DB status de medição → status usado pela UI do contratante. */
function mapDbMedicaoStatus(
  s: DbMedicao['status'],
): 'aguardando_aprovacao' | 'aprovada' | 'rejeitada' {
  if (s === 'pendente') return 'aguardando_aprovacao';
  if (s === 'contestada') return 'rejeitada';
  return 'aprovada';
}

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
  // Junta rua + número (ex.: "Rua X, 123") antes de cidade/UF, para exibir
  // e geocodar o endereço com a maior precisão disponível.
  const ruaComNumero = o.numero
    ? [o.endereco, o.numero].filter(Boolean).join(', ')
    : o.endereco;
  const partes = [ruaComNumero, o.complemento, o.cidade, o.uf].filter(Boolean);
  return partes.join(' - ') || o.endereco || '—';
}

/** DB row → ObraContratante (para grid de minhas-obras do contratante). */
export function dbToObraContratante(o: DbObra): ObraContratante & {
  visibilidade: DbObra['visibilidade'];
  statusModeracao?: DbObra['statusModeracao'];
  motivoModeracao?: string | null;
  empreiteiroVinculado: boolean;
} {
  const semEmpreiteira = !o.empreiteiraId;
  const empNome = !semEmpreiteira && o.empreiteiraInfo?.nome
    ? o.empreiteiraInfo.nome
    : semEmpreiteira ? 'Aguardando' : 'Empreiteira vinculada';
  const empIniciais = semEmpreiteira ? 'AG' : iniciaisFromNome(empNome) || 'EC';
  return {
    id: o.id,
    titulo: o.nome,
    endereco: fullEndereco(o),
    imagemUrl: o.fotoCapaUrl ?? DEFAULT_IMG,
    status: mapDbStatusToContratante(o.status),
    progresso: o.progresso ?? 0,
    orcamento: toNumber(o.valorTotal),
    dataInicio: o.dataInicio ? formatDate(o.dataInicio) : '—',
    dataPrevisaoFim: o.dataPrevisao ? formatDate(o.dataPrevisao) : '—',
    empreiteiro: semEmpreiteira
      ? { nome: 'Aguardando', iniciais: 'AG', cor: 'bg-gray-400' }
      : {
          nome: empNome,
          iniciais: empIniciais,
          cor: 'bg-primary',
          telefone: o.empreiteiraInfo?.telefone ?? undefined,
          email: o.empreiteiraInfo?.email ?? undefined,
          avatarUrl: o.empreiteiraInfo?.avatarUrl ?? undefined,
        },
    tipo: o.tipo ?? '—',
    candidaturas: o.candidaturasCount ?? 0,
    visibilidade: o.visibilidade,
    statusModeracao: o.statusModeracao ?? null,
    motivoModeracao: o.motivoModeracao ?? null,
    // Flag real (substitui o antigo teste `empreiteiro.nome === 'Aguardando'`).
    empreiteiroVinculado: !semEmpreiteira,
  };
}

/** DB row (+ anexos) → ObraContratanteDetalhe (página de detalhe). */
export function dbToObraContratanteDetalhe(
  o: DbObra,
  anexos: DbObraAnexo[] = [],
): ObraContratanteDetalhe & {
  visibilidade: DbObra['visibilidade'];
  statusModeracao?: DbObra['statusModeracao'];
  motivoModeracao?: string | null;
} {
  const base = dbToObraContratante(o);
  const orcamento = base.orcamento;

  // Computa valorPago a partir da soma das medições aprovadas (status='aprovada').
  // obras.valorPago no DB NÃO é atualizado quando medições são aprovadas — apenas
  // `progresso` é recalculado. Por isso, somamos direto das medições retornadas
  // pela API. Se não houver medições aprovadas, usa o campo DB como fallback.
  const valorPagoFromMedicoes = (o.medicoes ?? [])
    .filter((m) => m.status === 'aprovada')
    .reduce((s, m) => s + toNumber(m.valor), 0);
  const valorPago = valorPagoFromMedicoes > 0
    ? valorPagoFromMedicoes
    : toNumber(o.valorPago);

  const valorRestante = Math.max(0, orcamento - valorPago);
  const documentos = anexos.map((a) => ({
    id: a.id,
    nome: a.originalName || a.tipo,
    categoria: mapAnexoTipoToCategoria(a.tipo),
    tamanho: a.sizeBytes ? `${(a.sizeBytes / 1024 / 1024).toFixed(1)} MB` : undefined,
    data: a.createdAt ? formatDate(String(a.createdAt)) : '—',
    url: a.url ?? undefined,
    observacoes: a.observacao ?? undefined,
  }));

  // Mapeamento DB medições → ObraMedicaoContratante
  const medicoesUi = (o.medicoes ?? []).map((m) => ({
    id: m.id,
    numero: m.numero,
    periodo: m.etapa, // etapa é o descritor de período mais próximo do schema atual
    dataEnvio: m.createdAt ? formatDate(String(m.createdAt)) : '—',
    valor: Math.max(0, toNumber(m.valor)),
    status: mapDbMedicaoStatus(m.status),
    descricao: m.descricao ?? undefined,
  }));

  return {
    ...base,
    imagemUrl: o.fotoCapaUrl ?? DEFAULT_IMG,  // sobrescreve o DEFAULT_IMG do base
    candidaturas: o.candidaturasCount ?? base.candidaturas,
    descricao: o.descricao ?? '',
    valorPago,
    valorRestante,
    diasRestantes: o.diasRestantes ?? 0,
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
      medicoes: medicoesUi,
    },
    fotos: [],
    documentos,
    checklists: [],
    localizacao: {
      cidade: o.cidade ?? '',
      estado: o.uf ?? '',
      bairro: '',
      rua: o.endereco ?? '',
      numero: o.numero ?? undefined,
      complemento: o.complemento ?? undefined,
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
    // Usa a capa real quando a origem a fornece (`fotoCapaUrl`); DEFAULT_IMG é
    // só placeholder de imagem (não é dado de negócio mockado). O grid de
    // browse do empreiteiro (`/api/obras`) hoje não resolve a capa por linha
    // para não onerar a rota paginada — cai no placeholder, sem number falso.
    imagemUrl: o.fotoCapaUrl ?? DEFAULT_IMG,
    tipo: o.tipo ?? 'Geral',
    complexidade: mapComplexidade(o),
    status: 'recebendo_propostas',
    orcamento: toNumber(o.valorTotal),
    prazo: o.dataPrevisao ? formatDate(o.dataPrevisao) : '—',
    descricao: o.descricao ?? '',
    // Identidade do contratante NÃO é exposta no marketplace: GET /api/obras
    // faz strip de `clienteId` (PII) para o empreiteiro, então não há dado
    // real a mapear aqui. Campos vazios — a UI omite os blocos que dependiam
    // deles em vez de exibir o antigo literal 'Contratante' / 'CT'.
    contratante: { nome: '', iniciais: '', cor: 'bg-primary' },
    // Curadoria do admin: a coluna já chega via `getTableColumns(obras)` em
    // /api/obras (o strip por role remove só clienteId/candidaturasCount).
    // Antes era `false` fixo — o selo em NovaObraCard era código inalcançável.
    destaque: o.destaque ?? false,
    // Vem de /api/obras/[id] (detalhe). Na listagem o campo não é enviado e o
    // fallback 'nao_aplicado' é correto: obras já candidatadas são filtradas
    // fora pelo anti-self do GET /api/obras.
    applicationStatus: o.applicationStatus ?? 'nao_aplicado',
    dataPublicacao: formatRelative(o.createdAt ?? null),
    // Grid de browse do empreiteiro não expõe contagem de propostas de
    // concorrentes (por design) — usa `candidaturasCount` só quando a origem
    // fornece, senão 0. Não é o mesmo "0 falso" do hero do contratante (J40 #10).
    candidaturas: o.candidaturasCount ?? 0,
    materiaisPor: o.materiaisPor ?? undefined,
    modalidade: o.modalidade ?? undefined,
    anexosCount: typeof o.anexosCount === 'number' ? o.anexosCount : 0,
    naMinhaZona: o.naMinhaZona === true,
  };
}

/**
 * Linha de `obra_etapas` como devolvida por GET /api/obras/[id].
 *
 * `prazo` é `string` e não `Date`: o adapter roda no client, sobre o payload
 * já serializado em JSON, onde timestamps chegam como ISO string.
 */
interface DbObraEtapa {
  id: string;
  nome: string;
  descricao: string | null;
  ordem?: number;
  status?: string | null;
  prazo?: string | null;
}

/** Status do banco → status da UI. Qualquer valor inesperado vira 'pendente'. */
function mapEtapaStatus(s: string | null | undefined): ObraEtapa['status'] {
  return s === 'em_andamento' || s === 'concluida' ? s : 'pendente';
}

/** DB row → ObraDetalhe (página de detalhe do empreiteiro). */
export function dbToObraDetalheEmpreiteiro(
  o: DbObra,
  anexos: DbObraAnexo[] = [],
  etapas: DbObraEtapa[] = [],
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
    inicioPrevisto: o.dataInicio ? formatDate(o.dataInicio) : undefined,
    situacaoProjeto: undefined,
    observacoes: o.descricao ?? undefined,
    localizacao: {
      cidade: o.cidade ?? '—',
      estado: o.uf ?? '—',
      bairro: '',
      rua: o.endereco ?? undefined,
      numero: o.numero ?? undefined,
      complemento: o.complemento ?? undefined,
      cep: o.cep ?? undefined,
    },
    // Escopo real definido pelo contratante (tabela obra_etapas). Lista vazia
    // é legítima — o componente omite o bloco inteiro nesse caso.
    etapas: etapas.map((e) => ({
      id: e.id,
      nome: e.nome,
      descricao: e.descricao ?? '',
      prazo: e.prazo ? formatDate(e.prazo) : '—',
      status: mapEtapaStatus(e.status),
    })),
    documentos,
    // Requisitos não têm origem no schema hoje; o componente já guarda por
    // `.length > 0`, então a lista vazia simplesmente não renderiza nada.
    requisitos: [],
  };
}
