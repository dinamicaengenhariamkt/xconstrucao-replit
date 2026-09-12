import { useQuery } from '@tanstack/react-query';
import type { XgestaoAssinanteDetalhe, XgestaoFaturamento } from '../server/assinantes';
import type { XgestaoObraDetalhe } from '../server/obra-detalhe';
import type { XgestaoAdminObraRow, XgestaoObraStatus, XgestaoObrasPagina } from '../server/obras';
import type { ProfitSummaryData } from '@features/shared/profit/types';

const QUERY_CONFIG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

async function getJson<T>(url: string, erro: string): Promise<T> {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) throw new Error(erro);
  return response.json() as Promise<T>;
}

export interface XgestaoObrasFiltrosUI {
  busca?: string;
  status?: XgestaoObraStatus;
  empreiteiraId?: string;
  pagina?: number;
}

export type XgestaoObrasResposta = XgestaoObrasPagina & {
  empreiteiras: Array<{ id: string; nome: string }>;
};

export function useXgestaoAdminObras(filtros: XgestaoObrasFiltrosUI) {
  const params = new URLSearchParams();
  if (filtros.busca?.trim()) params.set('q', filtros.busca.trim());
  if (filtros.status) params.set('status', filtros.status);
  if (filtros.empreiteiraId) params.set('empreiteira_id', filtros.empreiteiraId);
  if (filtros.pagina && filtros.pagina > 1) params.set('pagina', String(filtros.pagina));
  const query = params.toString();

  return useQuery<XgestaoObrasResposta>({
    // A query string entra na chave para que cada combinação de filtro tenha
    // seu próprio cache, em vez de invalidar a lista a cada digitação.
    queryKey: ['admin', 'xgestao', 'obras', query],
    queryFn: () => getJson(`/api/admin/xgestao/obras${query ? `?${query}` : ''}`, 'Erro ao listar obras do xgestão'),
    ...QUERY_CONFIG,
  });
}

export function useXgestaoAdminObra(obraId: string) {
  return useQuery<XgestaoObraDetalhe>({
    queryKey: ['admin', 'xgestao', 'obra', obraId],
    queryFn: () => getJson(`/api/admin/xgestao/obras/${obraId}`, 'Erro ao carregar a obra'),
    enabled: Boolean(obraId),
    ...QUERY_CONFIG,
  });
}

export function useXgestaoAdminAssinantes() {
  return useQuery<{ rows: XgestaoAssinanteDetalhe[] }>({
    queryKey: ['admin', 'xgestao', 'assinantes'],
    queryFn: () => getJson('/api/admin/xgestao/assinantes', 'Erro ao listar assinantes'),
    ...QUERY_CONFIG,
  });
}

export function useXgestaoAdminFinanceiro() {
  return useQuery<{ lucro: ProfitSummaryData; faturamento: XgestaoFaturamento }>({
    queryKey: ['admin', 'xgestao', 'financeiro'],
    queryFn: () => getJson('/api/admin/xgestao/financeiro', 'Erro ao carregar o financeiro'),
    ...QUERY_CONFIG,
  });
}

export type { XgestaoAdminObraRow, XgestaoAssinanteDetalhe, XgestaoObraDetalhe, XgestaoObraStatus };
