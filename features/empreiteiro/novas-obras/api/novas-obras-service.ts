import { ENABLE_MOCK } from '../constants';
import { mockNovasObras, mockPerfilStatus } from '../mocks/novas-obras.mock';
import { getObraDetalheMock } from '../mocks/obra-detalhe.mock';
import type { NovaObra, PerfilStatus, ObraDetalhe } from '../types';

export async function getNovasObras(): Promise<NovaObra[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockNovasObras;
  }
  const response = await fetch('/api/empreiteiro/novas-obras');
  if (!response.ok) throw new Error('Erro ao buscar novas obras');
  return response.json();
}

export async function getPerfilStatus(): Promise<PerfilStatus> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockPerfilStatus;
  }
  const response = await fetch('/api/empreiteiro/perfil-status');
  if (!response.ok) throw new Error('Erro ao buscar status do perfil');
  return response.json();
}

export async function getObraDetalhe(id: string): Promise<ObraDetalhe> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const obra = getObraDetalheMock(id);
    if (!obra) throw new Error('Obra não encontrada');
    return obra;
  }
  const response = await fetch(`/api/empreiteiro/novas-obras/${id}`);
  if (!response.ok) throw new Error('Erro ao buscar detalhes da obra');
  return response.json();
}
