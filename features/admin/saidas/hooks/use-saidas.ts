import { useQuery } from '@tanstack/react-query';
import type {
  Saida,
  SaidaKpi,
  SaidaChartData,
  SaidaFutura,
  SaidaPeriodo,
  SaidaTopItem,
  DateRange,
} from '../types';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useSaidaKpi(periodo: SaidaPeriodo) {
  return useQuery<SaidaKpi>({
    queryKey: ['admin', 'saidas', 'kpi', periodo],
    queryFn: async () => {
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
      const res = await fetch('/api/admin/saidas/futuras');
      if (!res.ok) throw new Error('Erro ao buscar saídas futuras');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useTopEmpreiteirasPagas(periodo: SaidaPeriodo) {
  return useQuery<SaidaTopItem[]>({
    queryKey: ['admin', 'saidas', 'top-empreiteiras-pagas', periodo],
    queryFn: async () => {
      const res = await fetch(`/api/admin/saidas/top-empreiteiras-pagas?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar top empreiteiras pagas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useTopClientesReembolsados(periodo: SaidaPeriodo) {
  return useQuery<SaidaTopItem[]>({
    queryKey: ['admin', 'saidas', 'top-clientes-reembolsados', periodo],
    queryFn: async () => {
      const res = await fetch(`/api/admin/saidas/top-clientes-reembolsados?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar top clientes reembolsados');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
