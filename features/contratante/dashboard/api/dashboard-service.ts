/**
 * Service client-side do dashboard do contratante (J17). Busca os dados reais
 * agregados pelo endpoint `/api/contratante/dashboard`.
 */

import type { HealthSummaryData } from '@features/shared/health';
import type {
  ContratanteDashboardStats,
  DashboardPeriodo,
  EvolutionDataPoint,
  PhaseData,
  Pendencia,
  ValoresContratadosData,
} from '../types';

export interface ContratanteDashboardData {
  stats: ContratanteDashboardStats;
  evolution: EvolutionDataPoint[];
  fases: PhaseData[];
  valoresContratados: ValoresContratadosData;
  pendencias: Pendencia[];
  healthSummary: HealthSummaryData;
}

export async function getContratanteDashboardData(
  _periodo: DashboardPeriodo = '30dias',
): Promise<ContratanteDashboardData> {
  const response = await fetch('/api/contratante/dashboard');
  if (!response.ok) {
    throw new Error('Erro ao buscar dados do dashboard');
  }
  return response.json();
}
