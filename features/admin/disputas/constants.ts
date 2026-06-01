import type {
  DisputaCategoria,
  DisputaParte,
  DisputaPrioridade,
  DisputaStatus,
} from './types';

export const ITEMS_PER_PAGE = 10;

export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
} as const;

export const DISPUTA_STATUS_LABELS: Record<DisputaStatus, string> = {
  aberta: 'Aberta',
  em_analise: 'Em análise',
  aguardando_partes: 'Aguardando partes',
  resolvida: 'Resolvida',
  escalada: 'Escalada',
};

export const DISPUTA_STATUS_BADGE_CLASSES: Record<DisputaStatus, string> = {
  aberta:
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  em_analise:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  aguardando_partes:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  resolvida:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  escalada:
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const DISPUTA_STATUS_DOT_CLASSES: Record<DisputaStatus, string> = {
  aberta: 'bg-amber-500',
  em_analise: 'bg-blue-500',
  aguardando_partes: 'bg-purple-500',
  resolvida: 'bg-emerald-500',
  escalada: 'bg-red-500',
};

export const DISPUTA_CATEGORIA_LABELS: Record<DisputaCategoria, string> = {
  pagamento_atrasado: 'Pagamento atrasado',
  medicao_rejeitada: 'Medição rejeitada',
  qualidade_obra: 'Qualidade da obra',
  descumprimento_prazo: 'Descumprimento de prazo',
  escopo_contrato: 'Escopo / contrato',
  outros: 'Outros',
};

export const DISPUTA_PRIORIDADE_LABELS: Record<DisputaPrioridade, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
};

export const DISPUTA_PRIORIDADE_BADGE_CLASSES: Record<DisputaPrioridade, string> = {
  alta: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  media: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  baixa: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const DISPUTA_PARTE_LABELS: Record<DisputaParte, string> = {
  cliente: 'Cliente',
  empreiteira: 'Empreiteira',
};
