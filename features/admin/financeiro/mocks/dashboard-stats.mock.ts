import type { AdminFinanceiroDashboardStats, PeriodoSeletor } from '../types';

export const mockStatsByPeriodo: Record<PeriodoSeletor, AdminFinanceiroDashboardStats> = {
  '30dias': {
    volumeContratado: 2_150_000,
    totalPagoEmpreiteiras: 1_480_000,
    saldoPagar: 670_000,
    taxasPlataforma: 28_500,
    obrasRiscoFinanceiro: 2,
    inadimplencia: 1.8,
  },
  '3meses': {
    volumeContratado: 7_320_000,
    totalPagoEmpreiteiras: 5_190_000,
    saldoPagar: 2_130_000,
    taxasPlataforma: 96_000,
    obrasRiscoFinanceiro: 3,
    inadimplencia: 2.1,
  },
  '12meses': {
    volumeContratado: 25_480_000,
    totalPagoEmpreiteiras: 18_320_000,
    saldoPagar: 7_160_000,
    taxasPlataforma: 325_000,
    obrasRiscoFinanceiro: 5,
    inadimplencia: 2.4,
  },
  'personalizado': {
    volumeContratado: 25_480_000,
    totalPagoEmpreiteiras: 18_320_000,
    saldoPagar: 7_160_000,
    taxasPlataforma: 325_000,
    obrasRiscoFinanceiro: 5,
    inadimplencia: 2.4,
  },
};

export const mockDashboardStats: AdminFinanceiroDashboardStats = mockStatsByPeriodo['12meses'];
