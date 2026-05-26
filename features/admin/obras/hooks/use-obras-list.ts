import { useQuery } from '@tanstack/react-query';
import type { AdminObrasFilters, AdminObrasListResponse } from '../types/list';

const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

function buildQS(filters: AdminObrasFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.status) params.set('status', filters.status);
  if (filters.visibilidade) params.set('visibilidade', filters.visibilidade);
  if (filters.statusModeracao) params.set('status_moderacao', filters.statusModeracao);
  if (filters.clienteId) params.set('cliente_id', filters.clienteId);
  if (filters.empreiteiraId) params.set('empreiteira_id', filters.empreiteiraId);
  if (filters.periodoInicio) params.set('periodo_inicio', filters.periodoInicio);
  if (filters.periodoFim) params.set('periodo_fim', filters.periodoFim);
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useAdminObras(filters: AdminObrasFilters = {}) {
  return useQuery<AdminObrasListResponse>({
    queryKey: ['admin', 'obras', filters],
    queryFn: async () => {
      const res = await fetch(`/api/admin/obras${buildQS(filters)}`);
      if (!res.ok) throw new Error('Erro ao buscar obras');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
