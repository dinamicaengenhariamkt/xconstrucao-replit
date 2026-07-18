import { defineConfig, devices } from "@playwright/test";

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
