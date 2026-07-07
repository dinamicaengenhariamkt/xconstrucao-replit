import { useQuery } from '@tanstack/react-query';
import type { AuditoriaEvento, AuditoriaKpi } from '../types';

const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useAuditoriaKpi() {
  return useQuery<AuditoriaKpi>({
    queryKey: ['admin', 'auditoria', 'kpi'],
    queryFn: async () => {
      const res = await fetch('/api/admin/auditoria/kpi');
      if (!res.ok) throw new Error('Erro ao buscar KPIs de auditoria');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAuditoriaEventos() {
  return useQuery<AuditoriaEvento[]>({
    queryKey: ['admin', 'auditoria', 'eventos'],
    queryFn: async () => {
      const res = await fetch('/api/admin/auditoria/eventos');
      if (!res.ok) throw new Error('Erro ao buscar eventos de auditoria');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
