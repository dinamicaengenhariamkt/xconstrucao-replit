/**
 * Guard anti-produção para a suíte de testes de integração/E2E.
 *
 * Contexto (Jornada 36 — §8 Riscos): os testes rodam contra o Postgres real
 * apontado por `DATABASE_URL` (o projeto usa banco único no Replit; não há um
 * banco de teste isolado). Os specs limpam apenas o próprio lixo (dados cujo
 * nome contém "E2E"), então NÃO fazem TRUNCATE nem apagam dados em massa — o
 * risco real é *sujeira* + *carga*, não *destruição*. Ainda assim, a J36 exige
 * "falhar ruidosamente se a URL parecer de produção". Este guard implementa
 * exatamente isso: se `DATABASE_URL` cheirar a produção, ABORTA a suíte antes
 * de qualquer teste tocar no banco.
 *
 * Usado como `globalSetup` no playwright.config.ts. Não conecta ao banco nem
 * muta nada — só inspeciona a string de conexão.
 */

/**
 * Heurística para decidir se uma `DATABASE_URL` parece apontar para produção.
 *
 * Estratégia (allowlist + blocklist, com fail-closed opcional):
 *  - Permite explicitamente hosts locais/dev conhecidos (localhost, 127.0.0.1,
 *    helium/heliumdb — o banco de dev do Replit, sslmode=disable).
 *  - Bloqueia se o host/URL contiver marcadores de produção (`prod`, `live`,
 *    domínios de produção conhecidos) ou se `E2E_ALLOW_ANY_DB` não estiver
 *    setado e a URL não casar com nenhum host de dev reconhecido.
 *
 * Retorna `{ ok: true }` quando é seguro rodar, ou `{ ok: false, reason }` com
 * a explicação do motivo do bloqueio.
 */
export function inspecionarDatabaseUrl(
  rawUrl: string | undefined,
): { ok: true } | { ok: false; reason: string } {
  if (!rawUrl || rawUrl.trim() === "") {
    return {
      ok: false,
      reason:
        "DATABASE_URL não está definido. A suíte de integração precisa de um banco de DEV configurado.",
    };
  }

  const url = rawUrl.toLowerCase();

  // Extrai host (entre @ e a próxima / ou :) de forma tolerante a formatos.
  const afterAt = url.includes("@") ? url.slice(url.indexOf("@") + 1) : url;
  const host = afterAt.split(/[/:?]/)[0] ?? "";

  // 1) Blocklist explícita: marcadores fortes de produção.
  const PROD_MARKERS = ["prod", "production", "-live", ".live", "prd"];
  for (const marker of PROD_MARKERS) {
    if (host.includes(marker) || url.includes(marker)) {
      return {
        ok: false,
        reason: `DATABASE_URL parece de PRODUÇÃO (contém "${marker}"). Abortado por segurança. Rode a suíte apenas no ambiente de DEV.`,
      };
    }
  }

  // 2) Allowlist de hosts de desenvolvimento conhecidos.
  const DEV_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "helium", // banco de dev do Replit (helium/heliumdb)
    "postgres", // container docker local
    "db", // service local em docker-compose
  ];
  const isKnownDev = DEV_HOSTS.some(
    (h) => host === h || host.startsWith(`${h}.`) || host.startsWith(`${h}:`),
  );
  if (isKnownDev) return { ok: true };

  // 3) Host desconhecido: fail-closed, a menos que explicitamente liberado.
  if (process.env.E2E_ALLOW_ANY_DB === "1") return { ok: true };

  return {
    ok: false,
    reason:
      `DATABASE_URL aponta para um host não reconhecido como DEV ("${host}"). ` +
      `Por segurança a suíte foi abortada — ela pode estar apontando para produção. ` +
      `Se este host é seguro, defina E2E_ALLOW_ANY_DB=1 para liberar explicitamente.`,
  };
}

/**
 * globalSetup do Playwright: valida o ambiente antes de rodar qualquer spec.
 * Lança erro (aborta a suíte) se a `DATABASE_URL` parecer de produção.
 */
export default function globalSetup(): void {
  const verdict = inspecionarDatabaseUrl(process.env.DATABASE_URL);
  if (!verdict.ok) {
    throw new Error(
      `\n\n🛑 SUÍTE DE TESTES ABORTADA (guard anti-produção)\n${verdict.reason}\n\n` +
        `Veja tests/e2e/guards.ts / docs/jornadas/36-testes-integracao.md §8.\n`,
    );
  }
}
