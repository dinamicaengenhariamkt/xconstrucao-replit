import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { QUERY_CONFIG } from '../constants';
import {
  getContratanteDashboardData,
  type ContratanteDashboardData,
} from '../api/dashboard-service';
import type { DashboardPeriodo } from '../types';

/**
 * Dados reais do dashboard do contratante (J17). O endpoint agrega tudo de uma
 * vez; o `periodo` entra na queryKey para reagir ao seletor (o recorte temporal
 * fino é refinado no backend conforme os dados ganham histórico).
 */
export function useContratanteDashboard(
  periodo: DashboardPeriodo = '30dias',
): UseQueryResult<ContratanteDashboardData, Error> {
  return useQuery({
    queryKey: ['contratante', 'dashboard', periodo],
    queryFn: () => getContratanteDashboardData(periodo),
    staleTime: QUERY_CONFIG.staleTime,
    refetchOnWindowFocus: QUERY_CONFIG.refetchOnWindowFocus,
  });
}
