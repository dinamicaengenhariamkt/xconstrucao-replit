import { isCpfCnpjValid, unformatCpfCnpj } from '@shared/lib/masks';

/**
 * PAG-14 — o xgestão atende pessoa física ou jurídica: vale CPF ou CNPJ com
 * dígito verificador correto. Devolve o 1º documento válido (só dígitos).
 * Sem `server-only`: roda no servidor, na tela e nos testes com `tsx`.
 */
export function documentoXgestaoValido(...candidatos: Array<string | null | undefined>): string | undefined {
  for (const candidato of candidatos) {
    const digitos = unformatCpfCnpj(candidato ?? '');
    if ((digitos.length === 11 || digitos.length === 14) && isCpfCnpjValid(digitos)) return digitos;
  }
  return undefined;
}
