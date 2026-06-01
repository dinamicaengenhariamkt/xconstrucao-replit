import { useQuery } from '@tanstack/react-query';
import type { AdminFinanceiroDashboardStats } from '../types';

/** KPIs financeiros reais do dashboard admin (J09). */
export function useDashboardStats() {
  return useQuery<AdminFinanceiroDashboardStats>({
    queryKey: ['admin', 'financeiro', 'dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/dashboard-stats');
      if (!res.ok) throw new Error('Erro ao buscar KPIs financeiros');
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
