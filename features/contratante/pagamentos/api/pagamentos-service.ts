import { ENABLE_MOCK } from '../constants';
import { mockPagamentos, mockPagamentosKPI } from '../mocks/pagamentos.mock';
import type { PagamentoContratante, PagamentosKPI } from '../types';

export async function getPagamentos(): Promise<PagamentoContratante[]> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockPagamentos;
  }
  const response = await fetch('/api/contratante/pagamentos');
  if (!response.ok) throw new Error('Erro ao buscar pagamentos');
  return response.json();
}

export async function getPagamentosKPI(): Promise<PagamentosKPI> {
  if (ENABLE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockPagamentosKPI;
  }
  const response = await fetch('/api/contratante/pagamentos/kpi');
  if (!response.ok) throw new Error('Erro ao buscar KPIs de pagamentos');
  return response.json();
}
