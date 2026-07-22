import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * J50 — Métricas de split (marketplace) para o painel admin de financeiro.
 * Espelha `MetricasSplit` de `features/marketplace/metricas-service.ts`.
 */
export interface MarketplaceMetricas {
  totalConfirmado: number;
  totalRepassado: number;
  totalComissao: number;
  qtdPendentes: number;
  qtdConfirmados: number;
  qtdFalhos: number;
  valorPendente: number;
  totalSacado: number;
  qtdSaquesPendentes: number;
}

/** Resultado da reconciliação manual (POST /reconciliar). */
export interface ReconciliarResult {
  ok: boolean;
  verificados: number;
  recuperados: number;
  falhas: number;
  runAt: string;
}

const MARKETPLACE_METRICAS_KEY = ['admin', 'financeiro', 'marketplace-metricas'] as const;

/** Métricas de split do marketplace (J50). Vem zeradas se o marketplace não foi usado. */
export function useMarketplaceMetricas() {
  return useQuery<MarketplaceMetricas>({
    queryKey: MARKETPLACE_METRICAS_KEY,
    queryFn: async () => {
      const res = await fetch('/api/admin/marketplace/metricas', { credentials: 'include' });
      if (!res.ok) throw new Error('Erro ao buscar métricas de marketplace');
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Dispara a reconciliação manual dos splits pendentes e invalida as métricas no sucesso. */
export function useReconciliarSplit() {
  const qc = useQueryClient();
  return useMutation<ReconciliarResult, Error, { limit?: number } | void>({
    mutationFn: async (vars) => {
      const res = await fetch('/api/admin/marketplace/reconciliar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vars && 'limit' in vars ? { limit: vars.limit } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        const msg =
          data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
            ? data.message
            : 'Erro ao reconciliar pagamentos de split';
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MARKETPLACE_METRICAS_KEY });
    },
  });
}
