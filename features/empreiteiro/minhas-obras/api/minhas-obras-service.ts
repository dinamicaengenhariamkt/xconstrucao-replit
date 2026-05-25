import { ENABLE_MOCK } from '../constants';
import { mockMinhasObras } from '../mocks/minhas-obras.mock';
import { getMinhaObraDetalheMock } from '../mocks/minha-obra-detalhe.mock';
import type { MinhaObra, MinhaObraDetalhe } from '../types';

export async function getMinhasObras(): Promise<MinhaObra[]> {
  const response = await fetch('/api/empreiteiro/minhas-obras');
  if (!response.ok) {
    // Mock continua disponível como fallback apenas se a flag estiver ligada
    // (útil pra demos sem backend); caso contrário propaga o erro.
    if (ENABLE_MOCK) return mockMinhasObras;
    throw new Error('Erro ao buscar obras');
  }
  return response.json();
}

export async function getMinhaObraDetalhe(id: string): Promise<MinhaObraDetalhe> {
  const response = await fetch(`/api/empreiteiro/minhas-obras/${id}`);
  if (!response.ok) {
    if (ENABLE_MOCK) {
      const obra = getMinhaObraDetalheMock(id);
      if (!obra) throw new Error('Obra não encontrada');
      return obra;
    }
    if (response.status === 404) throw new Error('Obra não encontrada');
    throw new Error('Erro ao buscar detalhes da obra');
  }
  return response.json();
}
