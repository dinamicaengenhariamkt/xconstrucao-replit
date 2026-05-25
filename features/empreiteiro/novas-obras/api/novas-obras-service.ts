import {
  dbToNovaObra,
  dbToObraDetalheEmpreiteiro,
  type DbObra,
} from '@features/obras/adapters';
import type { NovaObra, PerfilStatus, ObraDetalhe } from '../types';

export async function getNovasObras(): Promise<NovaObra[]> {
  const response = await fetch('/api/obras');
  if (!response.ok) throw new Error('Erro ao buscar novas obras');
  const rows: DbObra[] = await response.json();
  return rows.map(dbToNovaObra);
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
