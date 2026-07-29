/**
 * Perfil mínimo para OPERAR — J61.
 *
 * Responde a uma pergunta só: "esta pessoa tem dados suficientes para publicar
 * uma obra (contratante) ou enviar uma proposta (empreiteiro)?".
 *
 * NÃO confundir com as duas outras noções de completude que já existem:
 *
 *  1. `clientes.perfil_completo` / `empreiteiras.perfil_completo` — derivado por
 *     `isProfileComplete` em `app/api/perfil/{contratante,empreiteiro}/route.ts`.
 *     É o gate da **curadoria do admin** e exige perfil rico: avatar para o
 *     contratante; avatar, descrição e portfólio para o empreiteiro. Continua
 *     valendo, intacto.
 *  2. `GET /api/empreiteiro/perfil-status` — um `completionPercentage`
 *     informativo com um checklist de 5 itens, divergente do item 1.
 *
 * Este predicado é deliberadamente mais enxuto que (1): pede o que é
 * indispensável para um contrato e uma cobrança existirem — identificação,
 * contato, documento fiscal e endereço — e nada além disso. Exigir foto de
 * perfil ou portfólio antes da primeira obra seria fricção sem contrapartida.
 *
 * Fonte única: servidor (guards de API), UI (desabilitar CTA) e testes leem
 * daqui. Sem uma quarta definição espalhada.
 */

/** Um campo pendente, já pronto para exibir. */
export interface CampoPendente {
  /** Nome da coluna — estável, para o front decidir o que fazer. */
  campo: string;
  /** Rótulo em português, como aparece na tela de configurações. */
  rotulo: string;
}

export interface ResultadoPodeOperar {
  ok: boolean;
  /** Vazio quando `ok`. Ordenado como na tela de perfil. */
  faltando: CampoPendente[];
}

/** Campo textual preenchido de fato (string não vazia após trim). */
function preenchido(v: unknown): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * Subconjunto de `clientes` que o predicado precisa. Aceitar um shape mínimo
 * (em vez de `typeof clientes.$inferSelect`) deixa o chamador fazer um SELECT
 * enxuto e permite reuso no client, onde o tipo do Drizzle não existe.
 */
export interface PerfilContratanteMinimo {
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  cnpjCpf?: string | null;
  cep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

export interface PerfilEmpreiteiroMinimo {
  nome?: string | null;
  responsavel?: string | null;
  email?: string | null;
  telefone?: string | null;
  cnpj?: string | null;
  cep?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  especialidades?: string[] | null;
  raioKm?: number | null;
}

/**
 * Contratante pode publicar obra?
 *
 * `null`/`undefined` (perfil inexistente) conta como incompleto — o chamador
 * distingue os casos se precisar.
 */
export function contratantePodeOperar(
  c: PerfilContratanteMinimo | null | undefined,
): ResultadoPodeOperar {
  const faltando: CampoPendente[] = [];
  if (!c) {
    return {
      ok: false,
      faltando: [{ campo: "perfil", rotulo: "Perfil de contratante" }],
    };
  }

  if (!preenchido(c.nome)) faltando.push({ campo: "nome", rotulo: "Nome" });
  if (!preenchido(c.email)) faltando.push({ campo: "email", rotulo: "E-mail" });
  if (!preenchido(c.telefone)) faltando.push({ campo: "telefone", rotulo: "Telefone" });
  if (!preenchido(c.cnpjCpf)) faltando.push({ campo: "cnpjCpf", rotulo: "CPF ou CNPJ" });
  if (!preenchido(c.cep)) faltando.push({ campo: "cep", rotulo: "CEP" });
  if (!preenchido(c.endereco)) faltando.push({ campo: "endereco", rotulo: "Endereço" });
  if (!preenchido(c.cidade)) faltando.push({ campo: "cidade", rotulo: "Cidade" });
  if (!preenchido(c.estado)) faltando.push({ campo: "estado", rotulo: "Estado" });

  return { ok: faltando.length === 0, faltando };
}

/**
 * Empreiteiro pode enviar proposta?
 *
 * Além do que se pede ao contratante, exige os dois campos que definem o que
 * ele faz e onde atua — sem eles a proposta não tem como ser avaliada:
 * `especialidades` (ao menos uma) e `raioKm` (> 0).
 */
export function empreiteiroPodeOperar(
  e: PerfilEmpreiteiroMinimo | null | undefined,
): ResultadoPodeOperar {
  const faltando: CampoPendente[] = [];
  if (!e) {
    return {
      ok: false,
      faltando: [{ campo: "perfil", rotulo: "Perfil de empreiteiro" }],
    };
  }

  if (!preenchido(e.nome)) faltando.push({ campo: "nome", rotulo: "Nome da empresa" });
  if (!preenchido(e.responsavel)) faltando.push({ campo: "responsavel", rotulo: "Responsável" });
  if (!preenchido(e.email)) faltando.push({ campo: "email", rotulo: "E-mail" });
  if (!preenchido(e.telefone)) faltando.push({ campo: "telefone", rotulo: "Telefone" });
  if (!preenchido(e.cnpj)) faltando.push({ campo: "cnpj", rotulo: "CNPJ" });
  if (!preenchido(e.cep)) faltando.push({ campo: "cep", rotulo: "CEP" });
  if (!preenchido(e.endereco)) faltando.push({ campo: "endereco", rotulo: "Endereço" });
  if (!preenchido(e.cidade)) faltando.push({ campo: "cidade", rotulo: "Cidade" });
  if (!preenchido(e.estado)) faltando.push({ campo: "estado", rotulo: "Estado" });

  // Arrays são `notNull` no schema com default `[]` — "não nulo" não significa
  // "preenchido". Por isso a checagem é de tamanho, não de existência.
  if (!Array.isArray(e.especialidades) || e.especialidades.length === 0) {
    faltando.push({ campo: "especialidades", rotulo: "Especialidades" });
  }
  if (typeof e.raioKm !== "number" || e.raioKm <= 0) {
    faltando.push({ campo: "raioKm", rotulo: "Raio de atuação (km)" });
  }

  return { ok: faltando.length === 0, faltando };
}

/** Código de erro devolvido pelos guards de API. O front já trata este `code`. */
export const CODE_PERFIL_INCOMPLETO = "PERFIL_INCOMPLETO";

/** Mensagem única para as duas personas — a lista de campos vem em `faltando`. */
export function mensagemPerfilIncompleto(faltando: CampoPendente[]): string {
  const nomes = faltando.map((f) => f.rotulo).join(", ");
  return `Complete seu perfil antes de continuar. Falta preencher: ${nomes}.`;
}
