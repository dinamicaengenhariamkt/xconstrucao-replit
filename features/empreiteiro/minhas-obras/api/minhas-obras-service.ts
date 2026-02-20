import { ENABLE_MOCK } from '../constants';
import { mockMinhasObras } from '../mocks/minhas-obras.mock';
import type { MinhaObra } from '../types';

export async function getMinhasObras(): Promise<MinhaObra[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMinhasObras;
  }
  const response = await fetch('/api/empreiteiro/minhas-obras');
  if (!response.ok) throw new Error('Erro ao buscar obras');
  return response.json();
}
