export function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Verifica se `term` aparece em qualquer um dos `fields`. Faz match
 * case-insensitive e ignora acentos. `term` deve já estar normalizado
 * (chamar `normalize` antes do loop por performance).
 */
export function matches(
  term: string,
  ...fields: (string | number | undefined | null)[]
): boolean {
  if (!term) return true;
  const haystack = normalize(
    fields
      .filter((v) => v !== null && v !== undefined && v !== '')
      .map(String)
      .join(' '),
  );
  return haystack.includes(term);
}
