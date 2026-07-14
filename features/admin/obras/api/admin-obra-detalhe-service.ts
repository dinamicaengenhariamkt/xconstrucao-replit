import { formatDate } from '@shared/lib/formatters';
import type { AdminObraDetalhe, AdminObraMedicao, ObraMedicaoStatus } from '../types';

export interface AdminObraApiResponse {
  id: string;
  nome: string;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  cidade: string | null;
  uf: string | null;
  tipo: string | null;
  status: string;
  visibilidade: string;
  valorTotal: string | null;
  valorPago: string | null;
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

function mapStatus(s: string): AdminObraDetalhe['status'] {
  switch (s) {
    case 'em_andamento':
    case 'concluida':
    case 'pausada':
    case 'cancelada':
      return s;
    case 'planejamento':
    default:
      return 'pausada';
  }
}

function mapMedicaoStatusAdmin(s: string): ObraMedicaoStatus {
  switch (s) {
    case 'aprovada': return 'aprovada_contratante';
    case 'contestada': return 'rejeitada_contratante';
    case 'pendente':
    default: return 'em_analise';
  }
}

function mapApiMedicaoToAdmin(m: Record<string, unknown>): AdminObraMedicao {
  const valorMedicao = Number(m.valor ?? 0) || 0;
  const status = String(m.status ?? '');
  const isPago = status === 'aprovada';
  const decidedAtRaw = m.decidedAt as string | null | undefined;
  const createdAtRaw = m.createdAt as string | null | undefined;
  const decidedAtStr = decidedAtRaw ? new Date(decidedAtRaw).toISOString().slice(0, 10) : undefined;
  return {
    id: String(m.id ?? ''),
    numero: Number(m.numero ?? 0),
    periodo: String(m.periodo || m.etapa || '—'),
    valorMedicao,
    valorPago: isPago ? valorMedicao : 0,
    status: mapMedicaoStatusAdmin(status),
    dataVencimento: m.dataEnvio
      ? String(m.dataEnvio).slice(0, 10)
      : (createdAtRaw ? new Date(createdAtRaw).toISOString().slice(0, 10) : '—'),
    dataPagamento: isPago ? decidedAtStr : undefined,
    dataAprovacao: isPago ? decidedAtStr : undefined,
    dataRejeicao: status === 'contestada' ? decidedAtStr : undefined,
    motivoRejeicao: (m.motivoRejeicao || m.motivoContestacao) as string | undefined,
  };
}

function actionToTitulo(action: string): string {
  switch (action) {
    case 'obras.create': return 'Obra criada';
    case 'obras.update': return 'Obra atualizada';
    case 'obras.delete': return 'Obra excluída';
    case 'obras.anexo.add':
    case 'uploads.commit.obra_anexo': return 'Anexo adicionado';
    case 'obras.anexo.delete':
    case 'uploads.delete.obra_anexo': return 'Anexo removido';
    default: return action;
  }
}

/**
 * Mapeia payload do `/api/admin/obras/[id]` (+ lista de medições opcional) para `AdminObraDetalhe`.
 * Item 16 J40: valorPago e medicoes agora vêm de dados reais.
 * valorPago é computado a partir da soma de medições aprovadas (status='aprovada'),
 * já que obras.valorPago no banco pode não estar atualizado após aprovação de medições.
 */
export function adaptAdminObraDetalhe(
  payload: AdminObraApiResponse,
  medicoesApi: Record<string, unknown>[] = [],
): AdminObraDetalhe {
  const valorTotal = Number(payload.valorTotal ?? 0) || 0;

  // Soma as medições aprovadas para obter valorPago real.
  const valorPagoFromMedicoes = medicoesApi
    .filter((m) => String(m.status ?? '') === 'aprovada')
    .reduce((s, m) => s + (Number(m.valor ?? 0) || 0), 0);
  // Prefere o valor computado das medições; cai para obras.valorPago como fallback.
  const valorPago = valorPagoFromMedicoes > 0
    ? valorPagoFromMedicoes
    : (Number(payload.valorPago ?? 0) || 0);

  const percentConcluido =
    typeof payload.percentConcluido === 'number'
      ? payload.percentConcluido
      : Number(payload.percentConcluido ?? 0) || 0;

  const medicoes: AdminObraMedicao[] = medicoesApi.map(mapApiMedicaoToAdmin);

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
    numero: payload.numero ?? undefined,
    complemento: payload.complemento ?? undefined,
    valorPago,
    aditivos: 0,
    valorTotal,
    medicoes,
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
  // Busca dados da obra e medições em paralelo (Item 16 J40).
  const [obraRes, medicoesRes] = await Promise.all([
    fetch(`/api/admin/obras/${id}`, { credentials: 'include' }),
    fetch(`/api/admin/obras/${id}/medicoes`, { credentials: 'include' }).catch(() => null),
  ]);

  if (!obraRes.ok) throw new Error(`Erro ao buscar obra (${obraRes.status})`);
  const payload = (await obraRes.json()) as AdminObraApiResponse;

  let medicoesApi: Record<string, unknown>[] = [];
  if (medicoesRes?.ok) {
    try {
      const medicoesData = await medicoesRes.json();
      if (Array.isArray(medicoesData)) {
        medicoesApi = medicoesData as Record<string, unknown>[];
      } else if (Array.isArray(medicoesData?.rows)) {
        medicoesApi = medicoesData.rows as Record<string, unknown>[];
      }
    } catch {
      // Falha silenciosa: medições ficam []
    }
  }

  return {
    detalhe: adaptAdminObraDetalhe(payload, medicoesApi),
    visibilidade: payload.visibilidade,
    anexos: payload.anexos ?? [],
  };
}
