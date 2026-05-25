import { apiRequest } from '@/lib/queryClient';

export interface MinhaCandidaturaRow {
  id: string;
  obraId: string | null;
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
  mensagemContratante: string | null;
  canceladaPeloEmpreiteiro: boolean;
  createdAt: string | null;
  decididaEm: string | null;
  obraNome: string | null;
  obraCidade: string | null;
  obraUf: string | null;
  obraTipo: string | null;
  obraVisibilidade: string | null;
  obraEmpreiteiraId: string | null;
}

export async function fetchMinhasCandidaturas(): Promise<MinhaCandidaturaRow[]> {
  const res = await fetch('/api/empreiteiro/candidaturas');
  if (!res.ok) throw new Error('Erro ao carregar suas candidaturas');
  return res.json();
}

export async function cancelarCandidatura(id: string) {
  return apiRequest('POST', `/api/empreiteiro/candidaturas/${id}/cancelar`);
}
