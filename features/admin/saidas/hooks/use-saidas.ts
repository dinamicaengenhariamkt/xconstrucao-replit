import { useQuery } from '@tanstack/react-query';
import type { Saida, SaidaKpi, SaidaChartData, SaidaFutura, SaidaPeriodo } from '../types';
import { mockSaidaKpi, mockSaidas, mockSaidaChartData, mockSaidasFuturas } from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useSaidaKpi(periodo: SaidaPeriodo) {
  return useQuery<SaidaKpi>({
    queryKey: ['admin', 'saidas', 'kpi', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockSaidaKpi;
      const res = await fetch(`/api/admin/saidas/kpi?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar KPIs de saídas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useSaidas(periodo: SaidaPeriodo) {
  return useQuery<Saida[]>({
    queryKey: ['admin', 'saidas', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockSaidas;
      const res = await fetch(`/api/admin/saidas?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar saídas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useSaidaChart(periodo: SaidaPeriodo) {
  return useQuery<SaidaChartData>({
    queryKey: ['admin', 'saidas', 'chart', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockSaidaChartData;
      const res = await fetch(`/api/admin/saidas/chart?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar gráfico de saídas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useSaidasFuturas() {
  return useQuery<SaidaFutura[]>({
    queryKey: ['admin', 'saidas', 'futuras'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockSaidasFuturas;
      const res = await fetch('/api/admin/saidas/futuras');
      if (!res.ok) throw new Error('Erro ao buscar saídas futuras');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
