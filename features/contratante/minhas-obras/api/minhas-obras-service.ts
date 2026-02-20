import { ENABLE_MOCK } from '../constants';
import { mockObrasContratante } from '../mocks/minhas-obras.mock';
import { getObraContratanteDetalheMock } from '../mocks/obra-detalhe.mock';
import type { ObraContratante, ObraContratanteDetalhe } from '../types';

export async function getObrasContratante(): Promise<ObraContratante[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockObrasContratante;
  }
  const response = await fetch('/api/contratante/minhas-obras');
  if (!response.ok) throw new Error('Erro ao buscar obras');
  return response.json();
}

export async function getObraContratanteDetalhe(id: string): Promise<ObraContratanteDetalhe> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const obra = getObraContratanteDetalheMock(id);
    if (!obra) throw new Error('Obra não encontrada');
    return obra;
  }
  const response = await fetch(`/api/contratante/minhas-obras/${id}`);
  if (!response.ok) throw new Error('Erro ao buscar detalhes da obra');
  return response.json();
}
