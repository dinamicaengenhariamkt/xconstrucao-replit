import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AdminObraFinanceiroDetalhe } from '../types';

/** Detalhe financeiro real de uma obra (J18 drill-down). */
export function useAdminObraDetalhe(
  id: string,
): UseQueryResult<AdminObraFinanceiroDetalhe, Error> {
  return useQuery({
    queryKey: ['admin', 'financeiro', 'obra-detalhe', id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/financeiro/obras/${id}`);
      if (res.status === 404) throw new Error('NOT_FOUND');
      if (!res.ok) throw new Error('Erro ao buscar detalhe da obra');
      return res.json();
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: false,
  });
}
