/**
 * Calcula a sequência de números/elipses a exibir num componente de paginação,
 * dado a página atual e o total de páginas. Mostra no máximo 7 itens.
 *
 * @example
 * getPaginationRange(1, 5)  // [1, 2, 3, 4, 5]
 * getPaginationRange(1, 10) // [1, 2, 3, 4, 5, 'ellipsis', 10]
 * getPaginationRange(7, 10) // [1, 'ellipsis', 6, 7, 8, 9, 10]
 * getPaginationRange(5, 10) // [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 */
export function getPaginationRange(
  current: number,
  total: number,
): (number | 'ellipsis')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
  if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
  return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
}
