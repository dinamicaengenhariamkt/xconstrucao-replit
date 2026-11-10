/**
 * PUB-01 — o que do endereço da obra pode ir para um link sem login.
 *
 * O formulário pede "Rua, número e complemento" num campo só, então o texto
 * chega em formatos variados ("Rua X, 123 - Apto 4", "Av. Y 1500 Bloco B",
 * "Rua Z, s/n", com ou sem vírgula, com ou sem CEP). Daqui sai só o
 * logradouro e, quando escrito no mesmo campo, o bairro. Número, complemento
 * e CEP nunca saem.
 *
 * O primeiro trecho (antes da 1ª vírgula ou " - ") é lido palavra a palavra e
 * cortado no primeiro token que seja número de porta ("1500", "123A", "nº",
 * "s/n", "numero") ou complemento ("apto", "bloco", "sala", "km"...). Número
 * que faz parte do nome fica: "Rua 25 de Março", "Av. 9 de Julho", "Rua 7",
 * "Rodovia SP-55". Se não dá para separar nome de porta ("Rua 1500", "123
 * Rua X"), o logradouro inteiro é descartado e sobra só o bairro.
 *
 * Nos demais trechos vale a regra da dúvida: qualquer pedaço com dígito, com
 * cara de complemento, sigla de UF ou igual à cidade (que a página já mostra
 * à parte) é descartado.
 */

const CEP = /\b\d{5}-?\d{3}\b/g;
const ROTULO_CEP = /\bcep\b[:.]?/gi;
const SEM_NUMERO = /^(s\/?n\.?|sem n[uú]mero)$/i;
const COMPLEMENTO =
  /^(apto?\.?|apartamento|ap\.?|bloco|bl\.?|casa|cs\.?|sala|sl\.?|loja|lj\.?|lote|lt\.?|quadra|qd\.?|conjunto|conj\.?|cj\.?|andar|torre|fundos|frente|galp[aã]o|box|km|edif[ií]cio|ed\.?|condom[ií]nio|cond\.?|unidade|un\.?|n[º°o]\.?|n\.)(\s|$)/i;

// Token de número de porta: "1500", "1.500", "123A", "12-B".
const TOKEN_NUMERO = /^\d[\d.]*(-?[a-z])?$/i;
// Marcador de número: "nº", "n°", "nº12", "n.", "numero", "número", "s/n".
const TOKEN_MARCADOR = /^(n[º°]\.?\d*|n\.|n[uú]mero|s\/n\.?|s\/?n)$/i;
// Palavras de complemento que, dentro do 1º trecho, encerram o logradouro.
const TOKEN_COMPLEMENTO =
  /^(apto?\.?|apartamento|ap\.?|bloco|bl\.?|casa|cs\.?|sala|sl\.?|loja|lj\.?|lote|lt\.?|quadra|qd\.?|conjunto|conj\.?|cj\.?|andar|torre|fundos|frente|galp[aã]o|box|km|edif[ií]cio|ed\.?|condom[ií]nio|cond\.?|unidade|un\.?)$/i;
// Tipo de logradouro: depois dele um número pode ser o nome ("Rua 7").
const TIPO_LOGRADOURO =
  /^(r\.?|rua|av\.?|avenida|al\.?|alameda|tv\.?|trav\.?|travessa|estr\.?|estrada|rod\.?|rodovia|p[cç]a\.?|pra[cç]a|lgo\.?|largo|via|viela|vila|beco|ladeira|servid[aã]o)$/i;
// Ligação que mostra que o número é nome ("25 de Março", "9 de Julho").
const LIGACAO_NOME = /^(de|do|da|dos|das)$/i;

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

function descartavel(trecho: string, cidade: string | null | undefined): boolean {
  if (!trecho) return true;
  if (/\d/.test(trecho)) return true;
  if (SEM_NUMERO.test(trecho)) return true;
  if (COMPLEMENTO.test(trecho)) return true;
  if (/^[A-Za-z]{2}$/.test(trecho)) return true; // UF
  if (cidade && normalizar(trecho) === normalizar(cidade)) return true;
  return false;
}

/**
 * Logradouro sem número de porta nem complemento, ou null quando não dá para
 * separar o nome da rua do número com segurança.
 */
function logradouroSemNumero(trecho: string): string | null {
  const tokens = trecho.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  const temTipo = TIPO_LOGRADOURO.test(tokens[0]);

  let corte = tokens.length;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const proximo = tokens[i + 1];

    if (TOKEN_MARCADOR.test(t)) {
      corte = i;
      break;
    }
    if (TOKEN_NUMERO.test(t)) {
      // Número logo depois do tipo pode ser o nome da rua.
      if (i === 1 && temTipo) {
        if (proximo && LIGACAO_NOME.test(proximo)) continue; // "Rua 25 de Março"
        // "Rua 7", "Rua 7 300", "Rua 12 apto 3": nome curto. Quatro dígitos
        // ou mais sem "de" depois ("Rua 1500") é porta sem nome: ambíguo.
        if (t.replace(/\D/g, '').length <= 3) continue;
        return null;
      }
      // Número dentro do nome ("Rua 7 de Setembro 300": o 7, não o 300).
      if (proximo && LIGACAO_NOME.test(proximo) && i > 0 && !TOKEN_NUMERO.test(tokens[i - 1])) {
        continue;
      }
      corte = i;
      break;
    }
    // Complemento logo depois do tipo é nome ("Rua Casa Verde"); depois disso, corta.
    if (TOKEN_COMPLEMENTO.test(t) && !(i === 1 && temTipo)) {
      corte = i;
      break;
    }
  }

  const resto = tokens.slice(0, corte);
  if (resto.length === 0) return null;
  // Só o tipo ("Rua") não identifica nada.
  if (resto.length === 1 && temTipo) return null;
  const texto = resto.join(' ').replace(/[\s,.-]+$/, '').trim();
  if (!texto || COMPLEMENTO.test(texto) || SEM_NUMERO.test(texto)) return null;
  return texto;
}

export function enderecoPublico(
  endereco: string | null | undefined,
  cidade?: string | null,
): string | null {
  if (!endereco) return null;
  const limpo = endereco.replace(CEP, ' ').replace(ROTULO_CEP, ' ').replace(/\s+/g, ' ').trim();
  const partes = limpo.split(/\s*,\s*|\s+[-–—]\s+|\s*;\s*/).map((p) => p.trim()).filter(Boolean);
  if (partes.length === 0) return null;

  const logradouro = logradouroSemNumero(partes[0]);
  const bairros = partes.slice(1).filter((p) => !descartavel(p, cidade));
  const saida = [logradouro, ...bairros].filter((p): p is string => !!p);
  return saida.length ? saida.join(', ') : null;
}
