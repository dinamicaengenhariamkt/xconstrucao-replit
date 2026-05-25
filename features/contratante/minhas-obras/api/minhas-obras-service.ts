import {
  dbToObraContratante,
  dbToObraContratanteDetalhe,
  type DbObra,
  type DbObraAnexo,
} from '@features/obras/adapters';
import type {
  ObraContratante,
  ObraContratanteDetalhe,
} from '../types';

export interface PaginatedResponse<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetObrasContratanteParams {
  page?: number;
  pageSize?: number;
  cidade?: string;
  uf?: string;
  minValor?: number;
  maxValor?: number;
  tipo?: string;
  modalidade?: string;
  materiaisPor?: string;
  visibilidade?: string;
}

export type ObraContratanteRow = ObraContratante & { visibilidade: DbObra['visibilidade'] };

export async function getObrasContratante(
  params: GetObrasContratanteParams = {},
): Promise<PaginatedResponse<ObraContratanteRow>> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const url = `/api/obras${qs.size > 0 ? `?${qs.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erro ao buscar obras');
  const payload: PaginatedResponse<DbObra> = await response.json();
  return {
    ...payload,
    rows: (payload.rows ?? []).map(dbToObraContratante),
  };
}

export async function getObraContratanteDetalhe(
  id: string,
): Promise<ObraContratanteDetalhe & { visibilidade: DbObra['visibilidade'] }> {
  const response = await fetch(`/api/obras/${id}`);
  if (!response.ok) throw new Error('Erro ao buscar detalhes da obra');
  const payload = await response.json();
  const obra: DbObra = payload?.obra ?? payload;
  const anexos: DbObraAnexo[] = payload?.anexos ?? [];
  return dbToObraContratanteDetalhe(obra, anexos);
}
