'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchWithSessionRefresh } from '@features/auth/utils/authenticated-fetch';
import type { ResultadoPodeOperar } from '@shared/lib/perfil-operacional';

export const XGESTAO_PERFIL_OPERACIONAL_KEY = ['xgestao', 'perfil-operacional'] as const;

export interface XGestaoPerfilOperacional extends ResultadoPodeOperar {
  message: string | null;
}

export function useXGestaoPerfilOperacional() {
  return useQuery<XGestaoPerfilOperacional>({
    queryKey: XGESTAO_PERFIL_OPERACIONAL_KEY,
    queryFn: async () => {
      const response = await fetchWithSessionRefresh('/api/xgestao/perfil-status', {
        cache: 'no-store',
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'Não foi possível verificar os dados da empresa.');
      }
      return response.json();
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}