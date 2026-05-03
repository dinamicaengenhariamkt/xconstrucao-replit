/**
 * Dados mockados para estatísticas do dashboard, particionados por período.
 */

import type { DashboardPeriodo, DashboardStats } from '../types';

export const mockDashboardStatsByPeriodo: Record<DashboardPeriodo, DashboardStats> = {
  '7dias': {
    obrasAtivas: 5,
    obrasAtivasDelta: 1,
    obrasConcluidas: 1,
    obrasConcluidasPeriodo: 'Últimos 7 dias',
    valorRecebido: 78_500,
    valorRecebidoDelta: 4,
    valorGasto: 56_200,
    valorGastoPeriodo: 'Últimos 7 dias',
  },
  '30dias': {
    obrasAtivas: 5,
    obrasAtivasDelta: 2,
    obrasConcluidas: 3,
    obrasConcluidasPeriodo: 'Últimos 30 dias',
    valorRecebido: 312_400,
    valorRecebidoDelta: 9,
    valorGasto: 224_800,
    valorGastoPeriodo: 'Últimos 30 dias',
  },
  '3meses': {
    obrasAtivas: 5,
    obrasAtivasDelta: 3,
    obrasConcluidas: 8,
    obrasConcluidasPeriodo: 'Últimos 3 meses',
    valorRecebido: 612_300,
    valorRecebidoDelta: 12,
    valorGasto: 460_500,
    valorGastoPeriodo: 'Últimos 3 meses',
  },
  '12meses': {
    obrasAtivas: 5,
    obrasAtivasDelta: 4,
    obrasConcluidas: 23,
    obrasConcluidasPeriodo: 'Últimos 12 meses',
    valorRecebido: 850_000,
    valorRecebidoDelta: 15,
    valorGasto: 620_000,
    valorGastoPeriodo: 'Últimos 12 meses',
  },
};

/** Compatibilidade com chamadas existentes — devolve a janela de 12 meses. */
export const mockDashboardStats: DashboardStats = mockDashboardStatsByPeriodo['12meses'];

// Mock para estado vazio (sem obras)
export const mockEmptyDashboardStats: DashboardStats = {
  obrasAtivas: 0,
  obrasAtivasDelta: 0,
  obrasConcluidas: 0,
  obrasConcluidasPeriodo: 'Este ano',
  valorRecebido: 0,
  valorRecebidoDelta: 0,
  valorGasto: 0,
  valorGastoPeriodo: 'No período',
};
