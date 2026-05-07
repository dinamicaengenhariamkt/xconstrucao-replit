import type { EmpreiteiraStatus } from './types';

export const statusConfig: Record<EmpreiteiraStatus, { label: string; className: string }> = {
  ativa: { label: 'Ativa', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  ativo: { label: 'Ativa', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  inativa: { label: 'Inativa', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  inativo: { label: 'Inativa', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  suspensa: { label: 'Suspensa', className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  pendente: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  aprovacao: { label: 'Aguardando curadoria', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
};

export const STATUS_OPTIONS: { value: EmpreiteiraStatus; label: string }[] = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'inativa', label: 'Inativa' },
  { value: 'suspensa', label: 'Suspensa' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'aprovacao', label: 'Aguardando curadoria' },
];

export const ITEMS_PER_PAGE = 12;
