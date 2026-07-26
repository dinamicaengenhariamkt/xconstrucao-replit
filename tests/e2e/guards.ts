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
import { classificarDatabaseUrl } from "../../shared/lib/db-env";

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

  // Blocklist/allowlist ficam em shared/lib/db-env.ts — mesma classificação
  // usada pelos scripts destrutivos (limpar-base, reset-and-seed), para que
  // "é dev?" tenha uma resposta só em todo o projeto.
  const classificacao = classificarDatabaseUrl(rawUrl);

  if (classificacao.tipo === "producao") {
    return {
      ok: false,
      reason: `DATABASE_URL parece de PRODUÇÃO (contém "${classificacao.marcador}"). Abortado por segurança. Rode a suíte apenas no ambiente de DEV.`,
    };
  }

  if (classificacao.tipo === "dev") return { ok: true };

  // Host desconhecido: fail-closed, a menos que explicitamente liberado.
  if (process.env.E2E_ALLOW_ANY_DB === "1") return { ok: true };

  return {
    ok: false,
    reason:
      `DATABASE_URL aponta para um host não reconhecido como DEV ("${classificacao.host}"). ` +
      `Por segurança a suíte foi abortada — ela pode estar apontando para produção. ` +
      `Se este host é seguro, defina E2E_ALLOW_ANY_DB=1 para liberar explicitamente.`,
  };
}

/**
 * Guard anti-gateway-real: garante que a suíte E2E nunca dispara chamadas ao
 * gateway de pagamento real (ASAAS ou qualquer outro).
 *
 * Contexto: `playwright.config.ts` injeta `PAYMENT_GATEWAY=manual` no
 * `webServer.env`, mas um segundo playwright.config criado para testes de UI
 * isolados poderia herdar `PAYMENT_GATEWAY=asaas` do ambiente e silenciosamente
 * chamar a API real. Este guard aborta a suíte de forma ruidosa antes que
 * qualquer spec toque no gateway.
 *
 * Retorna `{ ok: true }` quando é seguro rodar, ou `{ ok: false, reason }`.
 */
export function inspecionarPaymentGateway(
  gateway: string | undefined,
): { ok: true } | { ok: false; reason: string } {
  const gw = (gateway ?? "").trim().toLowerCase();

  if (gw === "" || gw === "manual") return { ok: true };

  return {
    ok: false,
    reason:
      `PAYMENT_GATEWAY está definido como "${gateway}" — apenas "manual" é permitido em testes E2E. ` +
      `Adicione 'process.env.PAYMENT_GATEWAY = "manual";' no topo do playwright.config usado ` +
      `(antes de 'export default defineConfig(...)') para que o valor seguro seja propagado ao ` +
      `worker de globalSetup e ao servidor de testes. ` +
      `Rodar a suíte com um gateway real pode gerar cobranças indesejadas na API ASAAS.`,
  };
}

/**
 * globalSetup do Playwright: valida o ambiente antes de rodar qualquer spec.
 * Lança erro (aborta a suíte) se a `DATABASE_URL` parecer de produção ou se
 * `PAYMENT_GATEWAY` não for "manual".
 */
export default function globalSetup(): void {
  const dbVerdict = inspecionarDatabaseUrl(process.env.DATABASE_URL);
  if (!dbVerdict.ok) {
    throw new Error(
      `\n\n🛑 SUÍTE DE TESTES ABORTADA (guard anti-produção)\n${dbVerdict.reason}\n\n` +
        `Veja tests/e2e/guards.ts / docs/jornadas/36-testes-integracao.md §8.\n`,
    );
  }

  const gwVerdict = inspecionarPaymentGateway(process.env.PAYMENT_GATEWAY);
  if (!gwVerdict.ok) {
    throw new Error(
      `\n\n🛑 SUÍTE DE TESTES ABORTADA (guard anti-gateway-real)\n${gwVerdict.reason}\n\n` +
        `Veja tests/e2e/guards.ts.\n`,
    );
  }
}
