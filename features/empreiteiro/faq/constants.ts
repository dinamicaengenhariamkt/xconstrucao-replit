export const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

export const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export const FAQ_CATEGORIES: Record<string, string> = {
  cadastro: 'Cadastro e Conta',
  obras: 'Obras',
  pagamentos: 'Pagamentos',
  suporte: 'Suporte Técnico',
};
