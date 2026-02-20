import { ENABLE_MOCK } from '../constants';
import { mockMinhasObras } from '../mocks/minhas-obras.mock';
import { getMinhaObraDetalheMock } from '../mocks/minha-obra-detalhe.mock';
import type { MinhaObra, MinhaObraDetalhe } from '../types';

export async function getMinhasObras(): Promise<MinhaObra[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMinhasObras;
  }
  const response = await fetch('/api/empreiteiro/minhas-obras');
  if (!response.ok) throw new Error('Erro ao buscar obras');
  return response.json();
}

export async function getMinhaObraDetalhe(id: string): Promise<MinhaObraDetalhe> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const obra = getMinhaObraDetalheMock(id);
    if (!obra) throw new Error('Obra não encontrada');
    return obra;
  }
  const response = await fetch(`/api/empreiteiro/minhas-obras/${id}`);
  if (!response.ok) throw new Error('Erro ao buscar detalhes da obra');
  return response.json();
}
