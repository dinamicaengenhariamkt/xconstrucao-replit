import { useQuery } from '@tanstack/react-query';
import type { CaixaResumo, Movimentacao, CaixaKpiData, IndiceEconomico, CaixaChartPoint, DateRange } from '../types';
import type { CaixaPeriodo } from '../types';
import {
  mockCaixaResumo,
  mockMovimentacoes,
  mockCaixaKpisByPeriodo,
  mockIndicadoresEconomicos,
  getCaixaChartDataByPeriodo,
} from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

function filterMovimentacoesByPeriodo(
  movs: Movimentacao[],
  periodo: CaixaPeriodo,
  customRange?: DateRange,
): Movimentacao[] {
  const now = new Date();
  let from: Date;
  let to: Date = now;

  switch (periodo) {
    case '7dias':
      from = new Date(now.getTime() - 7 * 86_400_000);
      break;
    case '30dias':
      from = new Date(now.getTime() - 30 * 86_400_000);
      break;
    case '90dias':
      from = new Date(now.getTime() - 90 * 86_400_000);
      break;
    case 'anoAtual':
      from = new Date(now.getFullYear(), 0, 1);
      break;
    case 'personalizado':
      if (!customRange) return movs;
      from = customRange.from;
      to = customRange.to ?? now;
      break;
    default:
      return movs;
  }

  return movs.filter((m) => {
    const d = new Date(m.data + 'T00:00:00');
    return d >= from && d <= to;
  });
}

export function useCaixaResumo() {
  return useQuery<CaixaResumo>({
    queryKey: ['admin', 'caixa', 'resumo'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockCaixaResumo;
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
      if (ENABLE_MOCK) return mockCaixaKpisByPeriodo[periodo];
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
      if (ENABLE_MOCK) return filterMovimentacoesByPeriodo(mockMovimentacoes, periodo, customRange);
      const res = await fetch('/api/admin/caixa/movimentacoes');
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
      if (ENABLE_MOCK) return mockIndicadoresEconomicos;
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
      if (ENABLE_MOCK) return getCaixaChartDataByPeriodo(periodo);
      const res = await fetch(`/api/admin/caixa/chart?periodo=${periodo}`);
      if (!res.ok) throw new Error('Erro ao buscar dados do gráfico');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
