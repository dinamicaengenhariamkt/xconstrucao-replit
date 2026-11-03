/**
 * Moeda digitada no xgestão: aceita formato brasileiro e o decimal da API.
 * Não remove pontos indiscriminadamente: "500.01" não pode virar 50001.
 */
export function dinheiroDecimal(entrada: string): string {
  const texto = entrada.trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
  let decimal: string;
  if (/^[1-9]\d{0,2}(?:\.\d{3})+(?:,\d{1,2})?$/.test(texto)) {
    decimal = texto.replace(/\./g, '').replace(',', '.');
  } else if (/^\d+(?:[.,]\d{1,2})?$/.test(texto)) {
    decimal = texto.replace(',', '.');
  } else {
    throw new Error('Informe um valor válido, por exemplo 1.500,50.');
  }
  const [inteiro, centavos = ''] = decimal.split('.');
  const normalizado = inteiro.replace(/^0+(?=\d)/, '');
  // NUMERIC(15,2): até treze algarismos inteiros; sem arredondamento silencioso.
  if (normalizado.length > 13) throw new Error('O valor excede o limite permitido.');
  return `${normalizado}.${centavos.padEnd(2, '0')}`;
}

/** A API recebe decimal canônico, nunca separadores locais nem notação científica. */
export function dinheiroApiValido(valor: unknown): boolean {
  if (typeof valor !== 'number' && typeof valor !== 'string') return false;
  const texto = String(valor).trim();
  return /^\d{1,13}(?:\.\d{1,2})?$/.test(texto) && Number.isFinite(Number(texto));
}

/** Aditivos podem reduzir o contrato; a precisão continua sendo de centavos. */
export function dinheiroComSinalDecimal(entrada: string): string {
  const texto = entrada.trim();
  const negativo = texto.startsWith('-');
  const valor = dinheiroDecimal(negativo ? texto.slice(1) : texto);
  return negativo && Number(valor) !== 0 ? `-${valor}` : valor;
}

export const orcamentoApiValido = dinheiroApiValido;
