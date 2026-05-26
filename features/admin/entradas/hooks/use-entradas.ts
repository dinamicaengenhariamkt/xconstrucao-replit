import { useQuery } from '@tanstack/react-query';
import { isMockEnabled } from '@/features/shared/lib/mock-flag';
import type {
  Entrada,
  EntradaKpi,
  EntradaChartData,
  EntradaTopItem,
  EntradaPeriodo,
  DateRange,
} from '../types';
import {
  mockEntradaKpiByPeriodo,
  mockEntradas,
  mockChartDataByPeriodo,
  mockTopClientesByPeriodo,
  mockTopEmpreiteirasByPeriodo,
} from '../mocks';

const ENABLE_MOCK = isMockEnabled();

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

function filterEntradasByPeriodo(
  entradas: Entrada[],
  periodo: EntradaPeriodo,
  customRange?: DateRange
): Entrada[] {
  const now = new Date();
  let from: Date;
  let to: Date = now;
  switch (periodo) {
    case '7dias':   from = new Date(now.getTime() - 7 * 86_400_000); break;
    case '30dias':  from = new Date(now.getTime() - 30 * 86_400_000); break;
    case '3meses':  from = new Date(now.getTime() - 90 * 86_400_000); break;
    case '12meses': from = new Date(now.getTime() - 365 * 86_400_000); break;
    case 'personalizado':
      if (!customRange) return entradas;
      from = customRange.from;
      to = customRange.to ?? now;
      break;
    default: return entradas;
  }
  return entradas.filter((e) => {
    const d = new Date(e.dataHora);
    return d >= from && d <= to;
  });
}

export function useEntradaKpi(periodo: EntradaPeriodo) {
  return useQuery<EntradaKpi>({
    queryKey: ['admin', 'entradas', 'kpi', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockEntradaKpiByPeriodo[periodo];
      const res = await fetch(`/api/admin/entradas/kpi?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar KPIs de entradas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useEntradas(periodo: EntradaPeriodo, customRange?: DateRange) {
  return useQuery<Entrada[]>({
    queryKey: [
      'admin', 'entradas', 'lista', periodo,
      customRange?.from?.toISOString(),
      customRange?.to?.toISOString(),
    ],
    queryFn: async () => {
      if (ENABLE_MOCK) return filterEntradasByPeriodo(mockEntradas, periodo, customRange);
      const params = new URLSearchParams({ periodo });
      if (customRange?.from) params.set('from', customRange.from.toISOString());
      if (customRange?.to)   params.set('to', customRange.to.toISOString());
      const res = await fetch(`/api/admin/entradas?${params}`);
      if (!res.ok) throw new Error('Erro ao buscar entradas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useEntradaChart(periodo: EntradaPeriodo) {
  return useQuery<EntradaChartData>({
    queryKey: ['admin', 'entradas', 'chart', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockChartDataByPeriodo[periodo];
      const res = await fetch(`/api/admin/entradas/chart?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar dados do gráfico de entradas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useTopClientes(periodo: EntradaPeriodo) {
  return useQuery<EntradaTopItem[]>({
    queryKey: ['admin', 'entradas', 'top-clientes', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockTopClientesByPeriodo[periodo];
      const res = await fetch(`/api/admin/entradas/top-clientes?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar top clientes');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useTopEmpreiteiras(periodo: EntradaPeriodo) {
  return useQuery<EntradaTopItem[]>({
    queryKey: ['admin', 'entradas', 'top-empreiteiras', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockTopEmpreiteirasByPeriodo[periodo];
      const res = await fetch(`/api/admin/entradas/top-empreiteiras?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar top empreiteiras');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
