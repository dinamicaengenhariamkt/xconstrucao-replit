import { useQuery } from '@tanstack/react-query';
import type {
  ObraAtencao,
  TopCliente,
  TopEmpreiteira,
  ReceitaPlataforma,
  AdoptionMetrics,
  SatisfactionMetrics,
  PaymentEvolutionData,
  StatusDistributionData,
  PeriodoSeletor,
} from '../types';
import type { HealthSummaryData } from '@features/shared/health';
import type { ProfitSummaryData } from '@features/shared/profit';

const CFG = { staleTime: 30 * 60 * 1000, refetchOnWindowFocus: false } as const;

export function useObrasAtencao() {
  return useQuery<ObraAtencao[]>({
    queryKey: ['admin', 'financeiro', 'obras-atencao'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/obras-atencao');
      if (!res.ok) throw new Error('Erro ao buscar obras em atenção');
      return res.json();
    },
    ...CFG,
  });
}

export function useTopClientes() {
  return useQuery<TopCliente[]>({
    queryKey: ['admin', 'financeiro', 'top-clientes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/top-clientes');
      if (!res.ok) throw new Error('Erro ao buscar top clientes');
      return res.json();
    },
    ...CFG,
  });
}

export function useTopEmpreiteiras() {
  return useQuery<TopEmpreiteira[]>({
    queryKey: ['admin', 'financeiro', 'top-empreiteiras'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/top-empreiteiras');
      if (!res.ok) throw new Error('Erro ao buscar top empreiteiras');
      return res.json();
    },
    ...CFG,
  });
}

export function useReceitasPlataforma() {
  return useQuery<{ receitas: ReceitaPlataforma[]; total: number }>({
    queryKey: ['admin', 'financeiro', 'receitas-plataforma'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/receitas-plataforma');
      if (!res.ok) throw new Error('Erro ao buscar receitas da plataforma');
      return res.json();
    },
    ...CFG,
  });
}

export function useAdoptionMetrics() {
  return useQuery<AdoptionMetrics>({
    queryKey: ['admin', 'financeiro', 'adoption'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/adoption');
      if (!res.ok) throw new Error('Erro ao buscar métricas de adoção');
      return res.json();
    },
    ...CFG,
  });
}

/**
 * J20 — NPS/CSAT reais. 204 (sem base de respostas) → `null`, e a página não
 * renderiza a seção (estado "dados pendentes" honesto, sem zeros falsos).
 */
export function useSatisfacao() {
  return useQuery<SatisfactionMetrics | null>({
    queryKey: ['admin', 'financeiro', 'satisfacao'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/satisfacao');
      if (res.status === 204) return null;
      if (!res.ok) throw new Error('Erro ao buscar métricas de satisfação');
      return res.json();
    },
    ...CFG,
  });
}

/** Saúde + lucro de todo o portfólio (J18) — substitui getMockHealth/ProfitSummary. */
export function usePortfolioSummary() {
  return useQuery<{ health: HealthSummaryData; profit: ProfitSummaryData }>({
    queryKey: ['admin', 'financeiro', 'portfolio-summary'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/portfolio-summary');
      if (!res.ok) throw new Error('Erro ao buscar resumo do portfólio');
      return res.json();
    },
    ...CFG,
  });
}

export function usePaymentEvolution(periodo: PeriodoSeletor) {
  return useQuery<PaymentEvolutionData[]>({
    queryKey: ['admin', 'financeiro', 'payment-evolution', periodo],
    queryFn: async () => {
      const res = await fetch(`/api/admin/financeiro/payment-evolution?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar evolução de pagamentos');
      return res.json();
    },
    ...CFG,
  });
}

export function useStatusDistribution() {
  return useQuery<StatusDistributionData[]>({
    queryKey: ['admin', 'financeiro', 'status-distribution'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/status-distribution');
      if (!res.ok) throw new Error('Erro ao buscar distribuição de status');
      return res.json();
    },
    ...CFG,
  });
}
