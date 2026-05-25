/**
 * Service para buscar lançamentos a receber + KPI do empreiteiro logado.
 * Os lançamentos são mapeados do schema `financeiro` para a shape histórica
 * `MedicaoEmpreiteiro` que a UI consome (status:
 * pendente=A Liberar, recebido=pago, rejeitado=cancelado).
 */
import type { MedicaoEmpreiteiro, PagamentosEmpreiteiroKPI } from '../types';

export async function getMedicoesEmpreiteiro(): Promise<MedicaoEmpreiteiro[]> {
  const response = await fetch('/api/empreiteiro/pagamentos', { credentials: 'include' });
  if (!response.ok) throw new Error('Erro ao buscar medições do empreiteiro');
  return response.json();
}

export async function getPagamentosKPI(): Promise<PagamentosEmpreiteiroKPI> {
  const response = await fetch('/api/empreiteiro/pagamentos/kpi', { credentials: 'include' });
  if (!response.ok) throw new Error('Erro ao buscar KPI de pagamentos');
  return response.json();
}
