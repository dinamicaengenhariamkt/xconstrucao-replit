import type { MedicaoContratanteStatus } from './types';

export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
} as const;

export const ITEMS_PER_PAGE = 10;

export const MEDICAO_CONTRATANTE_STATUS_LABELS: Record<MedicaoContratanteStatus, string> = {
  aguardando_aprovacao: 'Aguardando minha aprovação',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  paga: 'Paga',
};

export const MEDICAO_CONTRATANTE_STATUS_BADGE_CLASSES: Record<MedicaoContratanteStatus, string> = {
  aguardando_aprovacao:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  aprovada: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  rejeitada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  paga: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export const MEDICAO_CONTRATANTE_STATUS_DOT_CLASSES: Record<MedicaoContratanteStatus, string> = {
  aguardando_aprovacao: 'bg-amber-500',
  aprovada: 'bg-blue-500',
  rejeitada: 'bg-red-500',
  paga: 'bg-green-500',
};
