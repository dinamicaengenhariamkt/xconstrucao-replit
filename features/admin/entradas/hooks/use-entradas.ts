import { useQuery } from '@tanstack/react-query';
import type {
  Entrada,
  EntradaKpi,
  EntradaChartData,
  EntradaTopItem,
  EntradaPeriodo,
  DateRange,
} from '../types';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useEntradaKpi(periodo: EntradaPeriodo) {
  return useQuery<EntradaKpi>({
    queryKey: ['admin', 'entradas', 'kpi', periodo],
    queryFn: async () => {
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
      const res = await fetch(`/api/admin/entradas/top-empreiteiras?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar top empreiteiras');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
