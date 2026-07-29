/**
 * Detecção de ambiente a partir da string de conexão do Postgres.
 *
 * Fonte única de verdade para "esta DATABASE_URL é de desenvolvimento?".
 * Consumida por três lugares que precisam da MESMA resposta:
 *   - `tests/e2e/guards.ts`      — aborta a suíte se apontar para produção
 *   - `scripts/limpar-base.ts`   — exige confirmação extra fora de dev
 *   - `scripts/reset-and-seed.ts` — idem, para o TRUNCATE
 *
 * Antes desta extração cada um tinha a sua própria heurística, e a do
 * reset-and-seed era fraca a ponto de não reconhecer hosts gerenciados
 * (Neon/Supabase/Railway) como produção — um TRUNCATE poderia rodar contra
 * a base real sem pedir confirmação.
 *
 * A classificação é léxica: olha apenas a string, nunca conecta ao banco.
 */

/** Marcadores que indicam produção de forma forte o suficiente para bloquear. */
const PROD_MARKERS = ["prod", "production", "-live", ".live", "prd"];

/**
 * Hosts reconhecidos como banco local/de desenvolvimento.
 *
 * A comparação é por **host exato** — nunca por prefixo. Antes aceitava
 * `host.startsWith("db.")` (pensando em subdomínios de docker-compose), e isso
 * abria um furo grave: `db.<projeto>.supabase.co` — o formato padrão de host do
 * Supabase — era classificado como DESENVOLVIMENTO. Um banco de produção
 * Supabase passava sem exigir `CONFIRM_LIMPAR_PROD`, e a suíte E2E rodaria
 * contra ele. Mesmo raciocínio para `postgres.<algo>`.
 *
 * Hosts com domínio agora caem em `desconhecido`, que é fail-closed.
 */
const DEV_HOSTS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "helium", // banco de dev do Replit (helium/heliumdb)
  "postgres", // container docker local
  "db", // service local em docker-compose
];

export type ClassificacaoDb =
  /** Host explicitamente reconhecido como de desenvolvimento. */
  | { tipo: "dev"; host: string }
  /** Host/URL contém um marcador forte de produção. */
  | { tipo: "producao"; host: string; marcador: string }
  /** Host não reconhecido — tratado como produção (fail-closed). */
  | { tipo: "desconhecido"; host: string };

/** Extrai o host de uma URL de conexão, tolerante a formatos. */
export function extrairHost(rawUrl: string): string {
  const url = rawUrl.toLowerCase();
  const afterAt = url.includes("@") ? url.slice(url.indexOf("@") + 1) : url;
  return afterAt.split(/[/:?]/)[0] ?? "";
}

/**
 * Classifica a `DATABASE_URL`.
 *
 * Ordem: blocklist primeiro (um marcador de produção vence qualquer coisa),
 * depois allowlist de dev, e o que sobra é `desconhecido` — que os chamadores
 * devem tratar como produção.
 */
export function classificarDatabaseUrl(rawUrl: string): ClassificacaoDb {
  const url = rawUrl.toLowerCase();
  const host = extrairHost(rawUrl);

  for (const marcador of PROD_MARKERS) {
    if (host.includes(marcador) || url.includes(marcador)) {
      return { tipo: "producao", host, marcador };
    }
  }

  // Host exato apenas. `extrairHost` já removeu a porta, então `host === h`
  // cobre `postgres:5432`. Ver o comentário de DEV_HOSTS para o motivo de não
  // aceitar prefixo.
  const isDev = DEV_HOSTS.some((h) => host === h);
  if (isDev) return { tipo: "dev", host };

  return { tipo: "desconhecido", host };
}

/**
 * `true` quando a URL NÃO é comprovadamente de desenvolvimento.
 *
 * Fail-closed de propósito: host desconhecido conta como produção. É o
 * predicado que os scripts destrutivos usam para exigir confirmação extra.
 */
export function pareceProducao(rawUrl: string): boolean {
  return classificarDatabaseUrl(rawUrl).tipo !== "dev";
}
