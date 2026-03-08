import { useQuery } from '@tanstack/react-query';
import type { AdminDashboardStats, AdminDashboardAlerta } from '../types';
import { mockDashboardStats, mockDashboardAlertas } from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useDashboardStats() {
  return useQuery<AdminDashboardStats>({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockDashboardStats;
      const res = await fetch('/api/admin/dashboard/stats');
      if (!res.ok) throw new Error('Erro ao buscar estatísticas do dashboard');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useDashboardAlertas() {
  return useQuery<AdminDashboardAlerta[]>({
    queryKey: ['admin', 'dashboard', 'alertas'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockDashboardAlertas;
      const res = await fetch('/api/admin/dashboard/alertas');
      if (!res.ok) throw new Error('Erro ao buscar alertas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
