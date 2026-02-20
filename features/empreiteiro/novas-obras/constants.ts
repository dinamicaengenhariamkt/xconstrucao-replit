export const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

export const QUERY_CONFIG = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
} as const;

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
