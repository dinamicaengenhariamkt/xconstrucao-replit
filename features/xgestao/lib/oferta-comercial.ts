/**
 * XG41 — especificação executável da NOVA oferta aprovada.
 * Não substitui o catálogo legado nem altera contratos/linhas persistidas.
 * A ativação comercial é separada. SINAPI permanece congelado e não integra
 * esta entrega, inclusive no teste grátis.
 */
export const OFERTA_XGESTAO = {
  basic: {
    nome: 'Basic', mensal: 99, obrasAtivas: 1, pessoasEmpresa: 2,
    linksPorObra: 1, valoresPublicos: false, sinapi: false,
    features: [
      '1 obra ativa',
      'Equipe: você + 1 convidado',
      '1 link público por obra',
      'Dashboard, filtros e busca de obras',
      'Etapas e cronograma',
      'Fotos, Diário e Ocorrências',
      'Checklists e Timeline',
      'Documentos',
      'Financeiro (gasto x orçamento)',
    ],
  },
  basic_plus: {
    nome: 'Basic Plus', mensal: 179, obrasAtivas: 3, pessoasEmpresa: 5,
    linksPorObra: 3, valoresPublicos: true, sinapi: false,
    features: [
      'Tudo do Basic',
      'Até 3 obras ativas',
      'Equipe: até 5 pessoas',
      'Até 3 links públicos por obra',
      'Link público com valores (Pagamentos ligado)',
    ],
  },
  premium: {
    nome: 'Premium', mensal: 299, obrasAtivas: 10, pessoasEmpresa: 15,
    linksPorObra: null, valoresPublicos: true, sinapi: false,
    features: [
      'Tudo do Basic Plus',
      'Até 10 obras ativas',
      'Equipe: até 15 pessoas',
      'Links públicos ilimitados por obra',
      'Link público com valores (Pagamentos ligado)',
    ],
  },
} as const;

export type OfertaXgestao = keyof typeof OFERTA_XGESTAO;
/** Teste de 90 dias no Basic; somente leitura 24h após o fim; quem assina no teste ganha +1 mês. */
export const TESTE_NOVA_OFERTA = {
  dias: 90, plano: 'basic', aoVencer: 'somente_leitura', toleranciaHoras: 24, bonusMesesAoAssinar: 1,
} as const;
export const VALORES_PUBLICOS_APROVADOS = ['contrato', 'recebimentos', 'saldo'] as const;

/** Contar logins distintos da empresa, e não vínculos com suas obras. */
export function contarPessoasEmpresa(titular: string, membrosAtivos: readonly string[]): number {
  return new Set([titular, ...membrosAtivos]).size;
}
