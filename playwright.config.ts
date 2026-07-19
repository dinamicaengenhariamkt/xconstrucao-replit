import { defineConfig, devices } from "@playwright/test";

// Porta dedicada para os testes E2E (3010 por padrão), separada do workflow de
// desenvolvimento (5000). Pode ser sobrescrita via E2E_PORT.
//
// reuseExistingServer é sempre true: se um servidor E2E já estiver rodando
// na porta (ex.: run anterior que não foi encerrado), o Playwright o reutiliza
// em vez de falhar com EADDRINUSE. Para garantir um estado limpo com as envs
// corretas use `make test-e2e` ou `make test-e2e-aprovacao` — esses alvos matam
// qualquer processo legado na porta antes de chamar o Playwright.
const PORT = Number(process.env.E2E_PORT ?? 3010);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // Guard anti-produção (J36 §8): aborta a suíte se DATABASE_URL parecer de
  // produção, antes de qualquer teste tocar no banco. Ver tests/e2e/guards.ts.
  globalSetup: "./tests/e2e/guards.ts",
  timeout: 300_000,
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
  webServer: {
    command: `npx next dev -p ${PORT} -H 127.0.0.1`,
    url: BASE_URL,
    // Sempre reutiliza um servidor existente na porta — evita EADDRINUSE
    // tanto em CI (onde cada job começa limpo) quanto localmente (onde um
    // run anterior pode ter deixado o Next.js rodando).
    // Use os alvos do Makefile para garantir estado limpo quando necessário.
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      EMAIL_TEST_MODE: "1",
      E2E_TEST_AUTH: "1",
      NODE_ENV: "development",
      // distDir dedicado para não colidir com o lock do .next/dev do workflow
      NEXT_DIST_DIR: ".next-e2e",
      // Força o adapter manual em testes E2E para não chamar gateways reais.
      PAYMENT_GATEWAY: "manual",
    },
  },
});
