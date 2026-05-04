import type { PagamentoStatus } from './types';

export const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
} as const;

export const PAGAMENTO_STATUS_LABELS: Record<PagamentoStatus, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  atrasado: 'Atrasado',
  agendado: 'Agendado',
};

export const PAGAMENTO_STATUS_COLORS: Record<PagamentoStatus, string> = {
  pago: 'bg-success/10 text-success',
  pendente: 'bg-warning/10 text-warning',
  atrasado: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  agendado: 'bg-info/10 text-info',
};
