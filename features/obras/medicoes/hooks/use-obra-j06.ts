'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/* ====================== TYPES ====================== */
export type EtapaStatus = 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';
export interface ObraEtapaApi {
  id: string;
  obraId: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  progresso: number;
  status: EtapaStatus;
  responsavel: string | null;
  prazo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ObraDiarioApi {
  id: string;
  texto: string;
  autorId: string;
  autorNome: string;
  autorRole: string;
  createdAt: string;
  fotos: string[];
}

export type OcorrenciaGravidade = 'critico' | 'medio' | 'baixo';
export type OcorrenciaStatus = 'aberta' | 'resolvida';
export interface ObraOcorrenciaApi {
  id: string;
  titulo: string;
  descricao: string;
  gravidade: OcorrenciaGravidade;
  status: OcorrenciaStatus;
  autorId: string;
  autorNome: string;
  fotoUrl: string | null;
  resolvidoPorId: string | null;
  resolvidoPorNome: string | null;
  resolvidoEm: string | null;
  createdAt: string;
}

export type ObraFotoFase = 'antes' | 'durante' | 'agora' | null;
export interface ObraFotoApi {
  id: string;
  fileId?: string;
  url: string;
  fase: ObraFotoFase;
  tag: string | null;
  enviadaAoContratante: boolean;
  autorId: string;
  autorNome: string;
  autorRole: string;
  createdAt: string;
}

/* ====================== FETCH HELPERS ====================== */
async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error((await res.text()) || `${res.status}`);
  return res.json();
}

async function sendJSON<T>(method: 'POST' | 'PATCH' | 'DELETE', url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const text = await res.text();
  let parsed: unknown = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  if (!res.ok) {
    const msg = parsed && typeof parsed === 'object' && parsed && 'message' in parsed
      ? String((parsed as { message?: string }).message)
      : text || `${res.status}`;
    throw new Error(msg);
  }
  return (parsed as T);
}

/* ====================== ETAPAS ====================== */
export function useObraEtapas(obraId: string, enabled = true) {
  return useQuery({
    queryKey: ['obras', obraId, 'etapas'],
    queryFn: () => getJSON<{ rows: ObraEtapaApi[] }>(`/api/obras/${obraId}/etapas`).then((d) => d.rows),
    enabled: enabled && Boolean(obraId),
    staleTime: 30_000,
  });
}

export function useCreateEtapa(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { nome: string; descricao?: string | null; ordem?: number; responsavel?: string | null; prazo?: string | null }) =>
      sendJSON<ObraEtapaApi>('POST', `/api/obras/${obraId}/etapas`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obras', obraId, 'etapas'] });
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['admin', 'obras', obraId] });
    },
  });
}

export function useUpdateEtapa(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ etapaId, ...body }: { etapaId: string; nome?: string; progresso?: number; status?: EtapaStatus; descricao?: string | null; responsavel?: string | null; prazo?: string | null; ordem?: number }) =>
      sendJSON<ObraEtapaApi>('PATCH', `/api/obras/${obraId}/etapas/${etapaId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obras', obraId, 'etapas'] });
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['admin', 'obras', obraId] });
    },
  });
}

export function useDeleteEtapa(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (etapaId: string) => sendJSON<{ ok: true }>('DELETE', `/api/obras/${obraId}/etapas/${etapaId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obras', obraId, 'etapas'] });
      qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
      qc.invalidateQueries({ queryKey: ['admin', 'obras', obraId] });
    },
  });
}

/* ====================== DIÁRIO ====================== */
export function useObraDiario(obraId: string, enabled = true) {
  return useQuery({
    queryKey: ['obras', obraId, 'diario'],
    queryFn: () => getJSON<{ rows: ObraDiarioApi[] }>(`/api/obras/${obraId}/diario`).then((d) => d.rows),
    enabled: enabled && Boolean(obraId),
    staleTime: 30_000,
  });
}

export function useCreateDiario(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { texto: string; fotoFileIds?: string[] }) =>
      sendJSON<ObraDiarioApi>('POST', `/api/obras/${obraId}/diario`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obras', obraId, 'diario'] }),
  });
}

export function useDeleteDiario(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => sendJSON<{ ok: true }>('DELETE', `/api/obras/${obraId}/diario/${entryId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obras', obraId, 'diario'] }),
  });
}

/* ====================== OCORRÊNCIAS ====================== */
export function useObraOcorrencias(obraId: string, enabled = true) {
  return useQuery({
    queryKey: ['obras', obraId, 'ocorrencias'],
    queryFn: () => getJSON<{ rows: ObraOcorrenciaApi[] }>(`/api/obras/${obraId}/ocorrencias`).then((d) => d.rows),
    enabled: enabled && Boolean(obraId),
    staleTime: 30_000,
  });
}

export function useCreateOcorrencia(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { titulo: string; descricao: string; gravidade?: OcorrenciaGravidade; fotoFileId?: string | null }) =>
      sendJSON<ObraOcorrenciaApi>('POST', `/api/obras/${obraId}/ocorrencias`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obras', obraId, 'ocorrencias'] }),
  });
}

export function useResolverOcorrencia(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ocorrenciaId: string) =>
      sendJSON<ObraOcorrenciaApi>('POST', `/api/obras/${obraId}/ocorrencias/${ocorrenciaId}/resolver`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obras', obraId, 'ocorrencias'] }),
  });
}

/* ====================== FOTOS ====================== */
export function useObraFotos(obraId: string, enabled = true) {
  return useQuery({
    queryKey: ['obras', obraId, 'fotos'],
    queryFn: () => getJSON<{ rows: ObraFotoApi[] }>(`/api/obras/${obraId}/fotos`).then((d) => d.rows),
    enabled: enabled && Boolean(obraId),
    staleTime: 30_000,
  });
}

export function useCreateFoto(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { fileId: string; fase?: ObraFotoFase; tag?: string | null; enviadaAoContratante?: boolean }) =>
      sendJSON<ObraFotoApi>('POST', `/api/obras/${obraId}/fotos`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obras', obraId, 'fotos'] }),
  });
}

export function useDeleteFoto(obraId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fotoId: string) => sendJSON<{ ok: true }>('DELETE', `/api/obras/${obraId}/fotos/${fotoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obras', obraId, 'fotos'] }),
  });
}
