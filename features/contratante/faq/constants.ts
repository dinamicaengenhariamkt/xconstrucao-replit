export const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

export const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export const CONTRATANTE_FAQ_CATEGORIES: Record<string, string> = {
  contratantes: 'Para Contratantes',
  empreiteiros: 'Para Empreiteiros',
  plataforma: 'Sobre a Plataforma',
  pagamentos: 'Pagamentos',
};
