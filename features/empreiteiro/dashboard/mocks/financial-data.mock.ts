/**
 * Dados mockados para informações financeiras
 */

import type { FinancialOverview } from '../types';

export const mockFinancialData: FinancialOverview = {
  margemLucro: 27,
  margemLucroTrend: 'up',
  ticketMedio: 37000,
  ticketMedioDelta: 12,
  taxaConclusao: 82,
  taxaConclusaoDelta: 5,
  fluxoCaixa: [
    { mes: 'JAN', receitas: 65000, despesas: 48000 },
    { mes: 'FEV', receitas: 70000, despesas: 52000 },
    { mes: 'MAR', receitas: 72000, despesas: 54000 },
    { mes: 'ABR', receitas: 75000, despesas: 56000 },
    { mes: 'MAI', receitas: 78000, despesas: 58000 },
    { mes: 'JUN', receitas: 80000, despesas: 60000 },
    { mes: 'JUL', receitas: 85000, despesas: 62000 },
    { mes: 'AGO', receitas: 88000, despesas: 64000 },
    { mes: 'SET', receitas: 92000, despesas: 66000 },
    { mes: 'OUT', receitas: 95000, despesas: 68000 },
  ],
};

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
