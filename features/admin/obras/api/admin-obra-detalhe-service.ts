import type { AdminObraDetalhe } from '../types';

export interface AdminObraApiResponse {
  id: string;
  nome: string;
  endereco: string | null;
  cidade: string | null;
  uf: string | null;
  tipo: string | null;
  status: string;
  visibilidade: string;
  valorTotal: string | null;
  percentConcluido?: number | string | null;
  dataInicio: string | null;
  dataPrevisao: string | null;
  createdAt: string;
  cliente: { id: string; nome: string } | null;
  empreiteira: { id: string; nome: string } | null;
  anexos: Array<{
    id: string;
    tipo: string;
    observacao: string | null;
    originalName: string;
    mime: string;
    sizeBytes: number | null;
    url: string | null;
    createdAt: string;
  }>;
  history: Array<{
    id: string;
    action: string;
    actorId: string | null;
    payload: unknown;
    ip: string | null;
    createdAt: string;
  }>;
}

const VISIBILIDADE_LABEL: Record<string, string> = {
  rascunho: 'Rascunho',
  publicada: 'Publicada',
  pausada: 'Pausada',
  arquivada: 'Arquivada',
};

// Map DB status → status suportado pela UI admin (que só conhece em_andamento|concluida|pausada|cancelada).
function mapStatus(s: string): AdminObraDetalhe['status'] {
  switch (s) {
    case 'em_andamento':
    case 'concluida':
    case 'pausada':
    case 'cancelada':
      return s;
    case 'planejamento':
    default:
      // Pré-execução / desconhecido → tratamos como pausada (mais próximo no STATUS_CONFIG da UI).
      return 'pausada';
  }
}

function actionToTitulo(action: string): string {
  switch (action) {
    case 'obras.create':
      return 'Obra criada';
    case 'obras.update':
      return 'Obra atualizada';
    case 'obras.delete':
      return 'Obra excluída';
    case 'obras.anexo.add':
    case 'uploads.commit.obra_anexo':
      return 'Anexo adicionado';
    case 'obras.anexo.delete':
    case 'uploads.delete.obra_anexo':
      return 'Anexo removido';
    default:
      return action;
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

/**
 * Mapeia payload do `/api/admin/obras/[id]` para `AdminObraDetalhe`.
 * Campos que dependem de J06/J07/J08 (medicoes, valorPago, etc.) ficam zerados/[].
 */
export function adaptAdminObraDetalhe(payload: AdminObraApiResponse): AdminObraDetalhe {
  const valorTotal = Number(payload.valorTotal ?? 0) || 0;
  const percentConcluido =
    typeof payload.percentConcluido === 'number'
      ? payload.percentConcluido
      : Number(payload.percentConcluido ?? 0) || 0;

  return {
    id: payload.id,
    nome: payload.nome,
    codigo: `#${payload.id.slice(0, 8).toUpperCase()}`,
    status: mapStatus(payload.status),
    valorContratado: valorTotal,
    percentConcluido,
    dataInicio: payload.dataInicio ?? '',
    previsaoFim: payload.dataPrevisao ?? '',
    empreiteira: payload.empreiteira?.nome ?? '—',
    localizacao: [payload.cidade, payload.uf].filter(Boolean).join(', ') || '—',
    cliente: payload.cliente?.nome ?? '—',
    tipo: payload.tipo ?? '—',
    endereco: payload.endereco ?? '—',
    valorPago: 0,
    aditivos: 0,
    valorTotal,
    medicoes: [],
    historico: payload.history.map((h) => ({
      id: h.id,
      tipo: 'nota',
      titulo: actionToTitulo(h.action),
      descricao: typeof h.payload === 'object' && h.payload !== null
        ? Object.entries(h.payload as Record<string, unknown>)
            .filter(([k]) => k !== 'obraId')
            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
            .join(' · ')
        : '',
      data: formatDate(h.createdAt),
    })),
  };
}

export const VISIBILIDADE_LABEL_MAP = VISIBILIDADE_LABEL;

export async function getAdminObraDetalhe(id: string): Promise<{
  detalhe: AdminObraDetalhe;
  visibilidade: string;
  anexos: AdminObraApiResponse['anexos'];
}> {
  const res = await fetch(`/api/admin/obras/${id}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`Erro ao buscar obra (${res.status})`);
  const payload = (await res.json()) as AdminObraApiResponse;
  return {
    detalhe: adaptAdminObraDetalhe(payload),
    visibilidade: payload.visibilidade,
    anexos: payload.anexos ?? [],
  };
}
