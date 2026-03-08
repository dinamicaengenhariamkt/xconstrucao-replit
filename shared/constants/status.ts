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

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  em_execucao:    'bg-primary/90 text-white',
  com_atrasos:    'bg-red-500/90 text-white',
  com_pendencias: 'bg-amber-500/90 text-white',
  planejamento:   'bg-blue-500/90 text-white',
  finalizada:     'bg-green-600/90 text-white',
};
