import { isMockEnabled } from '@/features/shared/lib/mock-flag';

export const ENABLE_MOCK = isMockEnabled();

export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
} as const;

export const ITEMS_PER_PAGE = 6;

export const COMPLEXIDADE_LABELS: Record<string, string> = {
  baixa: 'Baixa complexidade',
  media: 'Média complexidade',
  alta: 'Alta complexidade',
};

export const COMPLEXIDADE_BADGE_VARIANTS: Record<string, string> = {
  baixa: 'success',
  media: 'warning',
  alta: 'error',
};

export const COMPLEXIDADE_BADGE_CLASSES: Record<string, string> = {
  baixa: 'bg-green-600/90 text-white',
  media: 'bg-amber-500/90 text-white',
  alta: 'bg-red-500/90 text-white',
};

export const NOVAS_OBRAS_STATUS_LABELS: Record<string, string> = {
  recebendo_propostas: 'Recebendo propostas',
  analise_final: 'Análise final',
  urgente: 'Urgente',
  encerrando: 'Encerrando em breve',
};

export const NOVAS_OBRAS_STATUS_DOT_CLASSES: Record<string, string> = {
  recebendo_propostas: 'bg-blue-500',
  analise_final: 'bg-purple-500',
  urgente: 'bg-red-500',
  encerrando: 'bg-amber-500',
};
