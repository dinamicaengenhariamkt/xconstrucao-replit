import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { ObraHealth } from '../types';

/**
 * Saúde real de UMA obra (J17), via `GET /api/obras/[id]/health`. Substitui
 * `getMockHealth(obra.id)` nas telas de detalhe (contratante/admin).
 */
export function useObraHealth(obraId: string | undefined): UseQueryResult<ObraHealth | null, Error> {
  return useQuery({
    queryKey: ['obra', 'health', obraId],
    queryFn: async () => {
      const res = await fetch(`/api/obras/${obraId}/health`);
      if (!res.ok) throw new Error('Erro ao buscar saúde da obra');
      return res.json();
    },
    enabled: Boolean(obraId),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
