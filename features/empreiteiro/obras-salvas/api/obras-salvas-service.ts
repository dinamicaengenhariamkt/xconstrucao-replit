import { dbToNovaObra, type DbObra } from '@features/obras/adapters';
import type { NovaObra } from '@features/empreiteiro/novas-obras/types';

export interface ObrasSalvasResponse {
  rows: NovaObra[];
  total: number;
}

export async function getObrasSalvas(): Promise<ObrasSalvasResponse> {
  const res = await fetch('/api/empreiteiro/obras-salvas', { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao carregar obras salvas');
  const payload = (await res.json()) as { rows: DbObra[]; total: number };
  return {
    rows: (payload.rows ?? []).map(dbToNovaObra),
    total: payload.total ?? 0,
  };
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
