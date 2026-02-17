import { EvolutionDataPoint, PhaseData, ValoresContratadosData } from '../types';

export const mockEvolutionData: EvolutionDataPoint[] = [
  { mes: 'JAN', planejado: 10, realizado: 8 },
  { mes: 'FEV', planejado: 20, realizado: 16 },
  { mes: 'MAR', planejado: 28, realizado: 23 },
  { mes: 'ABR', planejado: 36, realizado: 30 },
  { mes: 'MAI', planejado: 44, realizado: 37 },
  { mes: 'JUN', planejado: 52, realizado: 44 },
  { mes: 'JUL', planejado: 60, realizado: 51 },
  { mes: 'AGO', planejado: 68, realizado: 58 },
  { mes: 'SET', planejado: 75, realizado: 64 },
  { mes: 'OUT', planejado: 82, realizado: 71 },
];

export const mockPhaseData: PhaseData[] = [
  { name: 'Planejamento', value: 15, color: '#f59e0b' },
  { name: 'Fundação', value: 10, color: '#3b82f6' },
  { name: 'Estrutura', value: 35, color: '#8b5cf6' },
  { name: 'Acabamento', value: 25, color: '#f97316' },
  { name: 'Concluído', value: 15, color: '#22846D' },
];

export const mockValoresContratados: ValoresContratadosData = {
  totalContratado: 4_200_000,
  aditivos: 420_000,
  aditivosPercent: 10,
  executado: 2_800_000,
  aExecutar: 1_800_000,
  progressPercent: 85,
};
