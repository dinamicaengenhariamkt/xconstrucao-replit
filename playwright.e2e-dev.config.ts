import { defineConfig, devices } from "@playwright/test";

// Garante que o guard anti-gateway-real (tests/e2e/guards.ts) passe neste
// config. O processo filho de globalSetup herda process.env do runner, então
// forçar "manual" aqui evita que PAYMENT_GATEWAY=asaas do ambiente vaze.
// Atenção: este config reutiliza o dev server existente — se o servidor foi
// iniciado com PAYMENT_GATEWAY=asaas, os specs de pagamento verão o gateway
// real. Certifique-se de que o dev server rode sem PAYMENT_GATEWAY (default
// "manual") ao usar este config.
process.env.PAYMENT_GATEWAY = "manual";

/**
 * Config alternativo para rodar os testes E2E diretamente contra um servidor já
 * em execução. Não sobe servidor próprio — por isso é o caminho que funciona
 * quando o `webServer` do config principal não consegue detectar a porta.
 *
 * Uso:
 *   npx playwright test --config=playwright.e2e-dev.config.ts <spec>
 *   E2E_BASE_URL=http://127.0.0.1:3010 npx playwright test --config=... <spec>
 *
 * O alvo precisa ter sido iniciado com `E2E_TEST_AUTH=1` — sem isso as rotas
 * `/api/test/*` respondem 404 e todo `loginAs` falha. O dev server padrão do
 * Replit (porta 5000) normalmente NÃO tem essa flag; suba um dedicado:
 *
 *   EMAIL_TEST_MODE=1 E2E_TEST_AUTH=1 NEXT_DIST_DIR=.next-e2e \
 *     PAYMENT_GATEWAY=manual npx next dev -p 3010 -H 127.0.0.1
 */
const BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:5000";
export default defineConfig({
  testDir: "./tests/e2e",
  // Guard anti-produção (J36 §8): ver tests/e2e/guards.ts.
  globalSetup: "./tests/e2e/guards.ts",
  timeout: 90_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
