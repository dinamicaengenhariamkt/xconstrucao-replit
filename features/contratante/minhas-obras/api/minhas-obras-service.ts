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

export async function getObrasContratante(): Promise<
  Array<ObraContratante & { visibilidade: DbObra['visibilidade'] }>
> {
  const response = await fetch('/api/obras');
  if (!response.ok) throw new Error('Erro ao buscar obras');
  const rows: DbObra[] = await response.json();
  return rows.map(dbToObraContratante);
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
