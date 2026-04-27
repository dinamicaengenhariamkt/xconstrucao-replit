import type { HealthStatus, HealthFactorKey } from './types';

export const HEALTH_LABELS: Record<HealthStatus, string> = {
  saudavel: 'Saudável',
  atencao: 'Atenção',
  risco: 'Risco',
};

export const HEALTH_DESCRIPTIONS: Record<HealthStatus, string> = {
  saudavel: 'Obra em ritmo saudável, sem indicadores críticos.',
  atencao: 'Obra requer atenção em um ou mais indicadores.',
  risco: 'Obra em risco — intervenção recomendada.',
};

export const HEALTH_BADGE_CLASSES: Record<HealthStatus, string> = {
  saudavel: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
  atencao: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
  risco: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
};

export const HEALTH_DOT_CLASSES: Record<HealthStatus, string> = {
  saudavel: 'bg-green-500',
  atencao: 'bg-amber-500',
  risco: 'bg-red-500',
};

export const HEALTH_PROGRESS_COLOR: Record<HealthStatus, 'success' | 'warning' | 'error'> = {
  saudavel: 'success',
  atencao: 'warning',
  risco: 'error',
};

export const FACTOR_LABELS: Record<HealthFactorKey, string> = {
  atraso: 'Cronograma',
  financeiro: 'Financeiro',
  tarefas: 'Tarefas',
};

export const HEALTH_THRESHOLDS = {
  saudavel: 75,
  atencao: 60,
  individualRisco: 40,
  individualAtencao: 60,
} as const;

export const HEALTH_WEIGHTS: Record<HealthFactorKey, number> = {
  atraso: 0.4,
  financeiro: 0.35,
  tarefas: 0.25,
};
