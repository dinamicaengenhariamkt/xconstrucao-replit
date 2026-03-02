import { useQuery } from '@tanstack/react-query';
import type { Saida, SaidaKpi, SaidaChartData, SaidaFutura, SaidaPeriodo, DateRange } from '../types';
import {
  mockSaidaKpiByPeriodo,
  mockSaidas,
  mockSaidaChartDataByPeriodo,
  mockSaidasFuturas,
} from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

function filterSaidasByPeriodo(
  saidas: Saida[],
  periodo: SaidaPeriodo,
  customRange?: DateRange
): Saida[] {
  const now = new Date();
  let from: Date;
  let to: Date = now;
  switch (periodo) {
    case '7dias':   from = new Date(now.getTime() - 7 * 86_400_000); break;
    case '30dias':  from = new Date(now.getTime() - 30 * 86_400_000); break;
    case '3meses':  from = new Date(now.getTime() - 90 * 86_400_000); break;
    case '12meses': from = new Date(now.getTime() - 365 * 86_400_000); break;
    case 'personalizado':
      if (!customRange) return saidas;
      from = customRange.from;
      to = customRange.to ?? now;
      break;
    default: return saidas;
  }
  return saidas.filter((s) => {
    const d = new Date(s.dataHora);
    return d >= from && d <= to;
  });
}

export function useSaidaKpi(periodo: SaidaPeriodo) {
  return useQuery<SaidaKpi>({
    queryKey: ['admin', 'saidas', 'kpi', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockSaidaKpiByPeriodo[periodo];
      const res = await fetch(`/api/admin/saidas/kpi?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar KPIs de saídas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useSaidas(periodo: SaidaPeriodo, customRange?: DateRange) {
  return useQuery<Saida[]>({
    queryKey: [
      'admin', 'saidas', 'lista', periodo,
      customRange?.from?.toISOString(),
      customRange?.to?.toISOString(),
    ],
    queryFn: async () => {
      if (ENABLE_MOCK) return filterSaidasByPeriodo(mockSaidas, periodo, customRange);
      const params = new URLSearchParams({ periodo });
      if (customRange?.from) params.set('from', customRange.from.toISOString());
      if (customRange?.to)   params.set('to', customRange.to.toISOString());
      const res = await fetch(`/api/admin/saidas?${params}`);
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
      if (ENABLE_MOCK) return mockSaidaChartDataByPeriodo[periodo];
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
