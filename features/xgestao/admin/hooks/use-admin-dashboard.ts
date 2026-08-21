import { useQuery } from '@tanstack/react-query';
import type { XgestaoAdminDashboard } from '../server/dashboard';

export function useXgestaoAdminDashboard() {
  return useQuery<XgestaoAdminDashboard>({
    queryKey: ['admin', 'xgestao', 'dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/xgestao');
      if (!response.ok) throw new Error('Erro ao buscar a visão administrativa do xgestão');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}