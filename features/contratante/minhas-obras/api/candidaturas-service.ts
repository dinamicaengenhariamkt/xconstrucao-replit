import { apiRequest } from '@/lib/queryClient';

export interface CandidaturaAnexoApi {
  id: string;
  fileId: string;
  originalName: string;
  mime: string;
  sizeBytes: number;
  createdAt: string | null;
  url: string | null;
}

/** Row crua do GET /api/contratante/obras/[id]/candidaturas. */
export interface CandidaturaApiRow {
  id: string;
  status: 'pendente' | 'aceita' | 'rejeitada';
  valorProposta: string;
  prazoEstimado: number | null;
  dataInicio: string | null;
  dataTermino: string | null;
  descricao: string | null;
  atividades: string | null;
  observacoesPrazo: string | null;
  observacoesFinanceiras: string | null;
  motivoRejeicao: string | null;
  canceladaPeloEmpreiteiro: boolean;
  createdAt: string | null;
  decididaEm: string | null;
  empreiteiroUserId: string | null;
  empreiteiroNome: string | null;
  empreiteiroEmail: string | null;
  empreiteiroAvatarUrl: string | null;
  empreiteiraId: string | null;
  empreiteiraEmpresa: string | null;
  empreiteiraTelefone: string | null;
  empreiteiraAvatarUrl: string | null;
  empreiteiraAvaliacao: string | null;
  anexos?: CandidaturaAnexoApi[];
}

export async function fetchCandidaturasObra(obraId: string): Promise<CandidaturaApiRow[]> {
  const res = await fetch(`/api/contratante/obras/${obraId}/candidaturas`);
  if (!res.ok) throw new Error('Erro ao carregar propostas');
  return res.json();
}

export async function aceitarCandidatura(id: string, mensagem?: string) {
  return apiRequest('POST', `/api/contratante/candidaturas/${id}/aceitar`, {
    mensagem: mensagem || undefined,
  });
}

export async function rejeitarCandidatura(id: string, motivo?: string) {
  return apiRequest('POST', `/api/contratante/candidaturas/${id}/rejeitar`, {
    motivo: motivo || undefined,
  });
}
