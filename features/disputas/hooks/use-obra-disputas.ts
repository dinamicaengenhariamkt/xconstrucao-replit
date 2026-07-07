'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/** Espelha `DisputaObraView` do service (serializado em JSON). */
export interface DisputaObraView {
  id: string;
  codigo: string;
  alvoTipo: 'medicao' | 'pagamento';
  alvoId: string;
  categoria:
    | 'pagamento_atrasado'
    | 'medicao_rejeitada'
    | 'qualidade_obra'
    | 'descumprimento_prazo'
    | 'escopo_contrato'
    | 'outros';
  prioridade: 'alta' | 'media' | 'baixa';
  status: 'aberta' | 'em_analise' | 'aguardando_partes' | 'resolvida' | 'cancelada';
  titulo: string;
  descricao: string;
  valorEnvolvido: number | null;
  abertaPorMim: boolean;
  resolucaoTipo: 'favor_contratante' | 'favor_empreiteiro' | 'meio_termo' | null;
  resolucaoTexto: string | null;
  dataAbertura: string;
  dataResolucao: string | null;
  diasAberta: number;
}

export interface DisputaMensagemView {
  id: string;
  autorUserId: string;
  autorNome: string | null;
  texto: string;
  anexoFileId: string | null;
  interna: boolean;
  criadaEm: string;
}

export interface AbrirDisputaBody {
  obraId: string;
  alvoTipo: 'medicao' | 'pagamento';
  alvoId: string;
  categoria?: DisputaObraView['categoria'];
  prioridade?: DisputaObraView['prioridade'];
  titulo: string;
  descricao: string;
  valorEnvolvido?: number | null;
}

async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? 'Falha na requisição');
  }
  return res.json();
}

async function postJSON<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message ?? 'Falha na requisição') as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data as T;
}

/** Disputas de uma obra (aba J10 no detalhe da obra). */
export function useObraDisputas(obraId: string | null | undefined) {
  return useQuery({
    queryKey: ['obras', obraId, 'disputas'],
    queryFn: () => getJSON<DisputaObraView[]>(`/api/obras/${obraId}/disputas`),
    enabled: Boolean(obraId),
    staleTime: 30_000,
  });
}

/** Detalhe de uma disputa + thread de mensagens (sem notas internas para as partes). */
export function useDisputaDetalhe(disputaId: string | null | undefined) {
  return useQuery({
    queryKey: ['disputas', disputaId],
    queryFn: () =>
      getJSON<{ disputa: DisputaObraView & Record<string, unknown>; mensagens: DisputaMensagemView[] }>(
        `/api/disputas/${disputaId}`,
      ),
    enabled: Boolean(disputaId),
    staleTime: 15_000,
  });
}

/** Abre uma disputa. Invalida a lista da obra ao concluir. */
export function useAbrirDisputa(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AbrirDisputaBody) => postJSON('/api/disputas', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obras', obraId, 'disputas'] });
    },
  });
}

/** Adiciona uma mensagem à thread da disputa. */
export function useEnviarMensagemDisputa(disputaId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { texto: string; anexoFileId?: string | null }) =>
      postJSON(`/api/disputas/${disputaId}/mensagens`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disputas', disputaId] });
    },
  });
}
