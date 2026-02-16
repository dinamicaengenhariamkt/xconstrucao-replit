/**
 * Dados mockados para estatísticas do dashboard
 */

import type { DashboardStats } from '../types';

export const mockDashboardStats: DashboardStats = {
  obrasAtivas: 5,
  obrasAtivasDelta: 2,
  obrasConcluidas: 23,
  obrasConcluidasPeriodo: 'Este ano',
  valorRecebido: 850000,
  valorRecebidoDelta: 15,
  valorGasto: 620000,
  valorGastoPeriodo: 'No período',
};

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
