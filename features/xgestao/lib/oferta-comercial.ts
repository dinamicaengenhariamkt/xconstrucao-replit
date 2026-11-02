/**
 * XG41 — especificação executável da NOVA oferta aprovada.
 * Não substitui o catálogo legado nem altera contratos/linhas persistidas.
 * A ativação depende da transição comercial e da retomada do SINAPI.
 */
export const OFERTA_XGESTAO = {
  basic: {
    nome: 'Basic', mensal: 99, obrasAtivas: 1, pessoasEmpresa: 2,
    linksPorObra: 1, valoresPublicos: false, sinapi: false,
  },
  basic_plus: {
    nome: 'Basic Plus', mensal: 179, obrasAtivas: 3, pessoasEmpresa: 5,
    linksPorObra: 3, valoresPublicos: true, sinapi: true,
  },
  premium: {
    nome: 'Premium', mensal: 299, obrasAtivas: 10, pessoasEmpresa: 15,
    linksPorObra: null, valoresPublicos: true, sinapi: true,
  },
} as const;

export type OfertaXgestao = keyof typeof OFERTA_XGESTAO;
export const TESTE_NOVA_OFERTA = { dias: 90, plano: 'premium', aoVencer: 'somente_leitura' } as const;
export const VALORES_PUBLICOS_APROVADOS = ['contrato', 'recebimentos', 'saldo'] as const;

/** Contar logins distintos da empresa, e não vínculos com suas obras. */
export function contarPessoasEmpresa(titular: string, membrosAtivos: readonly string[]): number {
  return new Set([titular, ...membrosAtivos]).size;
}
