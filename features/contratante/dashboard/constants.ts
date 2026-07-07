/**
 * Constantes do Dashboard do Contratante
 */



export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export const PHASE_COLORS = {
  planejamento: '#f59e0b',
  fundacao: '#3b82f6',
  estrutura: '#8b5cf6',
  acabamento: '#f97316',
  concluido: '#22846D',
} as const;
