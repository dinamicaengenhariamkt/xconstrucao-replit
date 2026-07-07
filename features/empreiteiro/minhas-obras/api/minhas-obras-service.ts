import type { MinhaObra, MinhaObraDetalhe } from '../types';

export async function getMinhasObras(): Promise<MinhaObra[]> {
  const response = await fetch('/api/empreiteiro/minhas-obras');
  if (!response.ok) {
    throw new Error('Erro ao buscar obras');
  }
  return response.json();
}

export async function getMinhaObraDetalhe(id: string): Promise<MinhaObraDetalhe> {
  const response = await fetch(`/api/empreiteiro/minhas-obras/${id}`);
  if (!response.ok) {
    if (response.status === 404) throw new Error('Obra não encontrada');
    throw new Error('Erro ao buscar detalhes da obra');
  }
  return response.json();
}
