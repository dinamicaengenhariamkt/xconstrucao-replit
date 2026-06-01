import { useQuery } from '@tanstack/react-query';
import type { CaixaResumo, Movimentacao, CaixaKpiData, IndiceEconomico, CaixaChartPoint, DateRange } from '../types';
import type { CaixaPeriodo } from '../types';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useCaixaResumo() {
  return useQuery<CaixaResumo>({
    queryKey: ['admin', 'caixa', 'resumo'],
    queryFn: async () => {
      const res = await fetch('/api/admin/caixa/resumo');
      if (!res.ok) throw new Error('Erro ao buscar resumo do caixa');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useCaixaKpis(periodo: CaixaPeriodo) {
  return useQuery<CaixaKpiData>({
    queryKey: ['admin', 'caixa', 'kpis', periodo],
    queryFn: async () => {
      const res = await fetch(`/api/admin/caixa/kpis?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar KPIs do caixa');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useMovimentacoes(periodo: CaixaPeriodo, customRange?: DateRange) {
  return useQuery<Movimentacao[]>({
    queryKey: ['admin', 'caixa', 'movimentacoes', periodo, customRange?.from?.toISOString()],
    queryFn: async () => {
      const params = new URLSearchParams({ periodo });
      if (periodo === 'personalizado' && customRange?.from) params.set('from', customRange.from.toISOString());
      if (periodo === 'personalizado' && customRange?.to) params.set('to', customRange.to.toISOString());
      const res = await fetch(`/api/admin/caixa/movimentacoes?${params}`);
      if (!res.ok) throw new Error('Erro ao buscar movimentações');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useIndicadoresEconomicos() {
  return useQuery<IndiceEconomico[]>({
    queryKey: ['admin', 'caixa', 'indicadores'],
    queryFn: async () => {
      const res = await fetch('/api/admin/caixa/indicadores');
      if (!res.ok) throw new Error('Erro ao buscar indicadores econômicos');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useCaixaChartData(periodo: CaixaPeriodo) {
  return useQuery<CaixaChartPoint[]>({
    queryKey: ['admin', 'caixa', 'chart', periodo],
    queryFn: async () => {
      const res = await fetch(`/api/admin/caixa/chart?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar dados do gráfico');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
