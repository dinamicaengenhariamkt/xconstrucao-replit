import { useQuery } from '@tanstack/react-query';
import type {
  Entrada,
  EntradaKpi,
  EntradaChartData,
  EntradaTopItem,
  EntradaPeriodo,
} from '../types';
import {
  mockEntradaKpi,
  mockEntradas,
  mockChartData,
  mockTopClientes,
  mockTopEmpreiteiras,
} from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useEntradaKpi(periodo: EntradaPeriodo) {
  return useQuery<EntradaKpi>({
    queryKey: ['admin', 'entradas', 'kpi', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockEntradaKpi;
      const res = await fetch(`/api/admin/entradas/kpi?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar KPIs de entradas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useEntradas(periodo: EntradaPeriodo) {
  return useQuery<Entrada[]>({
    queryKey: ['admin', 'entradas', 'lista', periodo],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockEntradas;
      const res = await fetch(`/api/admin/entradas?periodo=${periodo}`);
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
      if (ENABLE_MOCK) return mockChartData;
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
      if (ENABLE_MOCK) return mockTopClientes;
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
      if (ENABLE_MOCK) return mockTopEmpreiteiras;
      const res = await fetch(`/api/admin/entradas/top-empreiteiras?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar top empreiteiras');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
