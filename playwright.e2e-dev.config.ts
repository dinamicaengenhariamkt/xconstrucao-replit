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
 * Config alternativo para rodar os testes E2E diretamente contra o servidor de
 * desenvolvimento já em execução (porta 5000, com E2E_TEST_AUTH=1 no .env.local).
 *
 * Uso: npx playwright test --config=playwright.e2e-dev.config.ts <spec>
 *
 * Não inicia um servidor próprio — reaproveita o dev server existente.
 */
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
    baseURL: "http://127.0.0.1:5000",
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
