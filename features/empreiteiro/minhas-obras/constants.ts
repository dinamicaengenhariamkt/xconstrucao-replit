export const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
} as const;

export const STATUS_LABELS: Record<string, string> = {
  em_execucao: 'Em execução',
  com_atrasos: 'Com atraso',
  com_pendencias: 'Com pendências',
  planejamento: 'Planejamento',
  finalizada: 'Finalizada',
};

export const STATUS_BORDER_COLORS: Record<string, string> = {
  em_execucao: 'border-l-primary',
  com_atrasos: 'border-l-red-500',
  com_pendencias: 'border-l-amber-500',
  planejamento: 'border-l-info',
  finalizada: 'border-l-success',
};

export const STATUS_BADGE_VARIANTS: Record<string, string> = {
  em_execucao: 'primary',
  com_atrasos: 'error',
  com_pendencias: 'warning',
  planejamento: 'info',
  finalizada: 'success',
};

export const PROGRESS_COLORS: Record<string, string> = {
  em_execucao: 'primary',
  com_atrasos: 'error',
  com_pendencias: 'warning',
  planejamento: 'info',
  finalizada: 'success',
};
