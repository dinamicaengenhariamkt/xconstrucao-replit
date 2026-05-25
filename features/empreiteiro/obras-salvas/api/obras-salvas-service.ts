import { dbToNovaObra, type DbObra } from '@features/obras/adapters';
import type { NovaObra } from '@features/empreiteiro/novas-obras/types';

export interface ObrasSalvasResponse {
  rows: NovaObra[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GetObrasSalvasParams {
  page?: number;
  pageSize?: number;
}

export async function getObrasSalvas(
  params: GetObrasSalvasParams = {},
): Promise<ObrasSalvasResponse> {
  const qs = new URLSearchParams();
  if (params.page !== undefined) qs.set('page', String(params.page));
  if (params.pageSize !== undefined) qs.set('pageSize', String(params.pageSize));
  const url = `/api/empreiteiro/obras-salvas${qs.size > 0 ? `?${qs.toString()}` : ''}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao carregar obras salvas');
  const payload = (await res.json()) as {
    rows: DbObra[];
    total: number;
    page?: number;
    pageSize?: number;
    totalPages?: number;
  };
  const pageSize = payload.pageSize ?? params.pageSize ?? 20;
  const total = payload.total ?? 0;
  return {
    rows: (payload.rows ?? []).map(dbToNovaObra),
    total,
    page: payload.page ?? params.page ?? 1,
    pageSize,
    totalPages: payload.totalPages ?? Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getObrasSalvasIds(): Promise<string[]> {
  const res = await fetch('/api/empreiteiro/obras-salvas?idsOnly=true', {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Erro ao carregar obras salvas');
  const payload = (await res.json()) as { ids?: string[] };
  return payload.ids ?? [];
}

export async function addObraSalva(obraId: string): Promise<void> {
  const res = await fetch('/api/empreiteiro/obras-salvas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ obraId }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ao salvar obra (${res.status})`);
  }
}

export async function removeObraSalva(obraId: string): Promise<void> {
  const res = await fetch(`/api/empreiteiro/obras-salvas/${obraId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Erro ao remover obra salva (${res.status})`);
  }
}
