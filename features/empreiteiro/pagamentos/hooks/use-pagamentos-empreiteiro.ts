import { mockMedicoesEmpreiteiro, mockPagamentosKPI } from '../mocks/pagamentos.mock';

export function usePagamentosEmpreiteiro() {
  return { data: mockMedicoesEmpreiteiro, isLoading: false };
}

export function usePagamentosEmpriteiroKPI() {
  return { data: mockPagamentosKPI, isLoading: false };
}
