'use client';

import { useQuery, useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import type { PlanoTier, PlanoPersona } from '@shared/lib/plans-catalog';

/**
 * Hooks client-side da UI de assinatura (J15). Consomem os endpoints reais da
 * J11 — nada de preço hardcoded.
 */

export interface PlanoApi {
  id: string;
  tier: PlanoTier;
  persona: PlanoPersona | 'ambos';
  nome: string;
  descricao: string | null;
  valorMensal: string;
  valorAnual: string | null;
  features: string[];
  ativo: boolean;
}

export interface PerfilPlano {
  persona: PlanoPersona;
  plano: PlanoTier;
  planoStartedAt: string | null;
  /** Status da assinatura: "ativa" | "inadimplente" | "cancelada" | null (free) */
  assinaturaStatus: string | null;
  /** Data ISO da próxima renovação (null se free ou sem assinatura) */
  renovaEm: string | null;
  catalogo: {
    nome: string;
    precoMensal: number;
    features: string[];
    limites: Record<string, number>;
  };
  uso: Array<{ key: string; label: string; current: number; max: number }>;
}

const CFG = { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } as const;

/** Lista os planos reais da persona do usuário (`GET /api/planos`). */
export function usePlanos(): UseQueryResult<PlanoApi[], Error> {
  return useQuery({
    queryKey: ['planos', 'lista'],
    queryFn: async () => {
      const res = await fetch('/api/planos');
      if (!res.ok) throw new Error('Erro ao buscar planos');
      return res.json();
    },
    ...CFG,
  });
}

/** Plano atual + uso/limites (`GET /api/perfil/plano`). */
export function usePerfilPlano(): UseQueryResult<PerfilPlano, Error> {
  return useQuery({
    queryKey: ['perfil', 'plano'],
    queryFn: async () => {
      const res = await fetch('/api/perfil/plano');
      if (!res.ok) throw new Error('Erro ao buscar plano atual');
      return res.json();
    },
    ...CFG,
  });
}

export type CheckoutResponse =
  | { ok: true; kind: 'activated'; assinaturaId: string }
  | { ok: true; kind: 'redirect'; url: string };

export class CheckoutError extends Error {
  code?: string;
  status: number;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'CheckoutError';
    this.status = status;
    this.code = code;
  }
}

/** Inicia o checkout. Trata os dois `kind` (activated/redirect) no caller. */
export function useCheckout() {
  const qc = useQueryClient();
  return useMutation<CheckoutResponse, CheckoutError, { planoId: string; ciclo: 'mensal' | 'anual' }>({
    mutationFn: async ({ planoId, ciclo }) => {
      const res = await fetch('/api/assinaturas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planoId, ciclo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new CheckoutError(data?.message ?? 'Erro ao assinar.', res.status, data?.code);
      }
      return data as CheckoutResponse;
    },
    onSuccess: (data) => {
      if (data.kind === 'redirect') {
        window.location.assign(data.url);
        return;
      }
      // Ativação imediata (adapter manual) → atualizar plano/uso.
      void qc.invalidateQueries({ queryKey: ['perfil', 'plano'] });
    },
  });
}

/** Cancela a assinatura ativa (volta para free). */
export function useCancelarAssinatura() {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/assinaturas/cancelar', { method: 'POST' });
      if (!res.ok) throw new Error('Erro ao cancelar assinatura');
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['perfil', 'plano'] });
    },
  });
}
