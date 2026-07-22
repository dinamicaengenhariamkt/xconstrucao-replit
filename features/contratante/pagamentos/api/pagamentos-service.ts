import { apiRequest } from '@shared/lib/queryClient';
import type { PagamentoContratante, PagamentosKPI } from '../types';

export async function getPagamentos(): Promise<PagamentoContratante[]> {
  const response = await fetch('/api/contratante/pagamentos', { credentials: 'include' });
  if (!response.ok) throw new Error('Erro ao buscar pagamentos');
  return response.json();
}

export async function getPagamentosKPI(): Promise<PagamentosKPI> {
  const response = await fetch('/api/contratante/pagamentos/kpi', { credentials: 'include' });
  if (!response.ok) throw new Error('Erro ao buscar KPIs de pagamentos');
  return response.json();
}

export interface QuitarPagamentoInput {
  metodoPagamento: string;
  dataPagamento?: string;
  comprovanteFileId?: string | null;
}

export async function quitarPagamento(id: string, input: QuitarPagamentoInput): Promise<void> {
  const res = await apiRequest('POST', `/api/contratante/pagamentos/${id}/quitar`, input);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || 'Erro ao registrar pagamento');
  }
}

/**
 * J47 — inicia o pagamento via plataforma (checkout Asaas com split).
 * Retorna a URL de pagamento hospedada para redirecionar o contratante.
 */
export async function checkoutSplitPagamento(id: string): Promise<string> {
  const res = await apiRequest('POST', `/api/contratante/pagamentos/${id}/checkout-split`, {});
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message || 'Não foi possível iniciar o pagamento via plataforma');
  return body.url as string;
}
