import type { MedicaoStatus } from './types';


export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
} as const;

export const ITEMS_PER_PAGE = 10;

export const MEDICAO_STATUS_LABELS: Record<MedicaoStatus, string> = {
  recebido: 'Recebido',
  aguardando_aprovacao: 'Aguardando Aprovação',
  pendente: 'A Liberar',
  atrasado: 'Atrasado',
  rejeitado: 'Rejeitado',
};

export const MEDICAO_STATUS_BADGE_CLASSES: Record<MedicaoStatus, string> = {
  recebido: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  aguardando_aprovacao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  pendente: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  atrasado: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  rejeitado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const MEDICAO_STATUS_DOT_CLASSES: Record<MedicaoStatus, string> = {
  recebido: 'bg-green-500',
  aguardando_aprovacao: 'bg-amber-500',
  pendente: 'bg-blue-500',
  atrasado: 'bg-orange-500',
  rejeitado: 'bg-red-500',
};

export const MEDICAO_STATUS_BAR_COLORS: Record<MedicaoStatus, string> = {
  recebido: 'bg-green-500',
  aguardando_aprovacao: 'bg-amber-500',
  pendente: 'bg-blue-500',
  atrasado: 'bg-orange-500',
  rejeitado: 'bg-red-500',
};
