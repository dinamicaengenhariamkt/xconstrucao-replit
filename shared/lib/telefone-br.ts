/**
 * XG52 — telefone brasileiro com DDD (opcional no cadastro; o Asaas não exige).
 * Aceita máscara, espaços e o prefixo +55. Válido: 10 dígitos (fixo) ou 11
 * (celular, o 3º dígito é 9), DDD de 11 a 99. Mesma regra no cliente e no servidor.
 */
export function somenteDigitosTelefone(valor: string | null | undefined): string {
  const digitos = (valor ?? '').replace(/\D/g, '');
  // +55 / 55 na frente de um número completo com DDD.
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return digitos.slice(2);
  return digitos;
}

export function telefoneBrValido(valor: string | null | undefined): boolean {
  const d = somenteDigitosTelefone(valor);
  if (d.length !== 10 && d.length !== 11) return false;
  if (d[0] === '0' || d[1] === '0') return false;
  if (d.length === 11 && d[2] !== '9') return false;
  return true;
}

export const MENSAGEM_TELEFONE_INVALIDO = 'Informe o telefone com DDD, ex.: (11) 99999-9999';
