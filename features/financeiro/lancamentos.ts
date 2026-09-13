/**
 * XG10 — vocabulário dos lançamentos financeiros da obra.
 *
 * `financeiro.tipo` e `financeiro.categoria` são colunas `text` livres no banco
 * (shared/db/schema.ts), sem enum Postgres. Sem um vocabulário único, API e UI
 * divergem em silêncio — um grava "saída" e o outro filtra por "saida", e o
 * lançamento some do total. Este módulo é a fonte dessas strings para os dois
 * lados; "entrada"/"saida" seguem o que `features/admin/financeiro` já usa.
 */

export const LANCAMENTO_TIPOS = ["entrada", "saida"] as const;
export type LancamentoTipo = (typeof LANCAMENTO_TIPOS)[number];

/**
 * Categorias de saída. A separação entre mão de obra e material foi pedida
 * explicitamente: "tem como separar o que é material e o que é mão de obra... eu
 * consigo separar ali, pelo menos, ter um filtro" (04:35–07:14).
 */
export const LANCAMENTO_CATEGORIAS = ["mao_de_obra", "material", "outras_despesas"] as const;
export type LancamentoCategoria = (typeof LANCAMENTO_CATEGORIAS)[number];

export const LANCAMENTO_TIPO_LABELS: Record<LancamentoTipo, string> = {
  entrada: "Entrada",
  saida: "Saída",
};

export const LANCAMENTO_CATEGORIA_LABELS: Record<LancamentoCategoria, string> = {
  mao_de_obra: "Mão de obra",
  material: "Material",
  outras_despesas: "Outras despesas",
};

export function isLancamentoTipo(v: unknown): v is LancamentoTipo {
  return typeof v === "string" && (LANCAMENTO_TIPOS as readonly string[]).includes(v);
}

export function isLancamentoCategoria(v: unknown): v is LancamentoCategoria {
  return typeof v === "string" && (LANCAMENTO_CATEGORIAS as readonly string[]).includes(v);
}
