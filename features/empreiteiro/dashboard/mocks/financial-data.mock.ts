/**
 * Dados mockados para informações financeiras, particionadas por período.
 *
 * O fluxo de caixa é exibido com granularidade adequada ao período:
 *   7 dias  → 7 pontos diários (D-6 ... hoje)
 *   30 dias → 4 semanas
 *   3 meses → 3 meses
 *   12 meses → 12 meses
 */

import type { DashboardPeriodo, FinancialOverview } from '../types';

export const mockFinancialOverviewByPeriodo: Record<DashboardPeriodo, FinancialOverview> = {
  '7dias': {
    margemLucro: 24,
    margemLucroTrend: 'up',
    ticketMedio: 32_400,
    ticketMedioDelta: 6,
    taxaConclusao: 78,
    taxaConclusaoDelta: 2,
    fluxoCaixa: [
      { mes: 'SEG', receitas: 12_400, despesas: 9_200 },
      { mes: 'TER', receitas: 11_100, despesas: 8_700 },
      { mes: 'QUA', receitas: 13_800, despesas: 10_100 },
      { mes: 'QUI', receitas: 12_900, despesas: 9_400 },
      { mes: 'SEX', receitas: 14_300, despesas: 10_800 },
      { mes: 'SÁB', receitas: 6_800, despesas: 4_200 },
      { mes: 'DOM', receitas: 7_200, despesas: 3_800 },
    ],
  },
  '30dias': {
    margemLucro: 26,
    margemLucroTrend: 'up',
    ticketMedio: 35_200,
    ticketMedioDelta: 9,
    taxaConclusao: 80,
    taxaConclusaoDelta: 4,
    fluxoCaixa: [
      { mes: 'S1', receitas: 70_400, despesas: 52_300 },
      { mes: 'S2', receitas: 76_800, despesas: 55_900 },
      { mes: 'S3', receitas: 81_200, despesas: 59_400 },
      { mes: 'S4', receitas: 84_000, despesas: 57_200 },
    ],
  },
  '3meses': {
    margemLucro: 27,
    margemLucroTrend: 'up',
    ticketMedio: 36_500,
    ticketMedioDelta: 11,
    taxaConclusao: 81,
    taxaConclusaoDelta: 5,
    fluxoCaixa: [
      { mes: 'AGO', receitas: 88_000, despesas: 64_000 },
      { mes: 'SET', receitas: 92_000, despesas: 66_000 },
      { mes: 'OUT', receitas: 95_000, despesas: 68_000 },
    ],
  },
  '12meses': {
    margemLucro: 27,
    margemLucroTrend: 'up',
    ticketMedio: 37_000,
    ticketMedioDelta: 12,
    taxaConclusao: 82,
    taxaConclusaoDelta: 5,
    fluxoCaixa: [
      { mes: 'JAN', receitas: 65_000, despesas: 48_000 },
      { mes: 'FEV', receitas: 70_000, despesas: 52_000 },
      { mes: 'MAR', receitas: 72_000, despesas: 54_000 },
      { mes: 'ABR', receitas: 75_000, despesas: 56_000 },
      { mes: 'MAI', receitas: 78_000, despesas: 58_000 },
      { mes: 'JUN', receitas: 80_000, despesas: 60_000 },
      { mes: 'JUL', receitas: 85_000, despesas: 62_000 },
      { mes: 'AGO', receitas: 88_000, despesas: 64_000 },
      { mes: 'SET', receitas: 92_000, despesas: 66_000 },
      { mes: 'OUT', receitas: 95_000, despesas: 68_000 },
      { mes: 'NOV', receitas: 97_000, despesas: 69_500 },
      { mes: 'DEZ', receitas: 99_000, despesas: 71_000 },
    ],
  },
};

/** Compatibilidade com chamadas existentes — devolve a janela de 12 meses. */
export const mockFinancialData: FinancialOverview = mockFinancialOverviewByPeriodo['12meses'];

// Mock para estado vazio (sem dados financeiros)
export const mockEmptyFinancialData: FinancialOverview = {
  margemLucro: 0,
  margemLucroTrend: 'neutral',
  ticketMedio: 0,
  ticketMedioDelta: 0,
  taxaConclusao: 0,
  taxaConclusaoDelta: 0,
  fluxoCaixa: [],
};
