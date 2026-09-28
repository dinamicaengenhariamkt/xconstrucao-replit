export const AREAS_XGESTAO = [
  "financeiro",
  "cronograma",
  "diario",
  "ocorrencias",
  "links",
  "equipe",
] as const;

export type AreaXgestao = (typeof AREAS_XGESTAO)[number];

/** null preserves the unrestricted behavior of legacy memberships. */
export type AreasPermitidas = AreaXgestao[] | null;

export const CATEGORIAS_FINANCEIRO_RESTRITAS = ["mao_de_obra"] as const;
export type CategoriaFinanceiroRestrita =
  (typeof CATEGORIAS_FINANCEIRO_RESTRITAS)[number];

/** null means all finance categories; a listed category is the only one allowed. */
export type CategoriasFinanceiroPermitidas =
  CategoriaFinanceiroRestrita[] | null;

export function membroPodeAcessarArea(
  areasPermitidas: AreasPermitidas,
  area: AreaXgestao,
): boolean {
  return areasPermitidas === null || areasPermitidas.includes(area);
}

export function membroPodeAcessarCategoriaFinanceira(
  categoriasPermitidas: CategoriasFinanceiroPermitidas,
  categoria: string | null,
): boolean {
  return categoriasPermitidas === null ||
    (categoria !== null && categoriasPermitidas.includes(
      categoria as CategoriaFinanceiroRestrita,
    ));
}