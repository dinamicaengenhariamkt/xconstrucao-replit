/**
 * Service para buscar medições e KPI de recebimentos do empreiteiro.
 */

import { ENABLE_MOCK } from '../constants';
import { mockMedicoesEmpreiteiro, mockPagamentosKPI } from '../mocks/pagamentos.mock';
import type { MedicaoEmpreiteiro, PagamentosEmpreiteiroKPI } from '../types';

export async function getMedicoesEmpreiteiro(): Promise<MedicaoEmpreiteiro[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockMedicoesEmpreiteiro;
  }

  const response = await fetch('/api/empreiteiro/pagamentos');
  if (!response.ok) {
    throw new Error('Erro ao buscar medições do empreiteiro');
  }
  return response.json();
}

export async function getPagamentosKPI(): Promise<PagamentosEmpreiteiroKPI> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockPagamentosKPI;
  }

  const response = await fetch('/api/empreiteiro/pagamentos/kpi');
  if (!response.ok) {
    throw new Error('Erro ao buscar KPI de pagamentos');
  }
  return response.json();
}
