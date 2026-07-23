import { useQuery } from '@tanstack/react-query';
import type { ContratoAceite, ContratoDocumento, ContratoKpi } from '../types';

const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useContratosKpi() {
  return useQuery<ContratoKpi[]>({
    queryKey: ['admin', 'contratos', 'kpi'],
    queryFn: async () => {
      const res = await fetch('/api/admin/contratos/kpi');
      if (!res.ok) throw new Error('Erro ao buscar KPIs de contratos');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useContratosAceites(filtros?: { documento?: ContratoDocumento; q?: string }) {
  const params = new URLSearchParams();
  if (filtros?.documento) params.set('documento', filtros.documento);
  if (filtros?.q) params.set('q', filtros.q);
  const qs = params.toString();

  return useQuery<ContratoAceite[]>({
    queryKey: ['admin', 'contratos', 'aceites', filtros?.documento ?? null, filtros?.q ?? null],
    queryFn: async () => {
      const res = await fetch(`/api/admin/contratos${qs ? `?${qs}` : ''}`);
      if (!res.ok) throw new Error('Erro ao buscar aceites');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
