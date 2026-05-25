import {
  dbToNovaObra,
  dbToObraDetalheEmpreiteiro,
  type DbObra,
} from '@features/obras/adapters';
import type { NovaObra, PerfilStatus, ObraDetalhe } from '../types';

export interface PaginatedResponse<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetNovasObrasParams {
  page?: number;
  pageSize?: number;
  cidade?: string;
  uf?: string;
  minValor?: number;
  maxValor?: number;
  tipo?: string;
  modalidade?: string;
  materiaisPor?: string;
}

export async function getNovasObras(
  params: GetNovasObrasParams = {},
): Promise<PaginatedResponse<NovaObra>> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
  });
  const url = `/api/obras${qs.size > 0 ? `?${qs.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erro ao buscar novas obras');
  const payload: PaginatedResponse<DbObra> = await response.json();
  return {
    ...payload,
    rows: (payload.rows ?? []).map(dbToNovaObra),
  };
}

export async function getPerfilStatus(): Promise<PerfilStatus> {
  const response = await fetch('/api/empreiteiro/perfil-status');
  if (!response.ok) {
    return {
      isBlocked: false,
      completionPercentage: 100,
      pendencias: [],
      motivoBloqueio: '',
      motivosBloqueio: [],
    };
  }
  return response.json();
}

export async function getObraDetalhe(id: string): Promise<ObraDetalhe> {
  const response = await fetch(`/api/obras/${id}`);
  if (!response.ok) throw new Error('Erro ao buscar detalhes da obra');
  const payload = await response.json();
  const obra: DbObra = payload?.obra ?? payload;
  const anexos = Array.isArray(payload?.anexos) ? payload.anexos : [];
  return dbToObraDetalheEmpreiteiro(obra, anexos);
}
