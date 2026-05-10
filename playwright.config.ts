import { defineConfig, devices } from "@playwright/test";

// Usa uma porta dedicada para os testes E2E (3010 por padrão), evitando conflitos
// com o workflow de desenvolvimento que roda na 5000. Assim o webServer pode subir
// um Next.js próprio com EMAIL_TEST_MODE=1 / E2E_TEST_AUTH=1 sem mexer no dev.
const PORT = Number(process.env.E2E_PORT ?? 3010);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

/**
 * Playwright config para a suíte de Onboarding (Identidade & Vínculos).
 *
 * - Reusa o servidor Next.js já rodando localmente (npm run dev).
 *   Se nenhum servidor responder, o Playwright sobe um automaticamente
 *   com EMAIL_TEST_MODE=1 e E2E_TEST_AUTH=1 — necessários para que os
 *   endpoints test-only (/api/test/emails, /api/test/oauth-simulate)
 *   fiquem ativos e os emails sejam capturados em memória ao invés de
 *   irem para a Brevo.
 */
export default defineConfig({
  testDir: "./tests/e2e",
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
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      EMAIL_TEST_MODE: "1",
      E2E_TEST_AUTH: "1",
      NODE_ENV: "development",
      // distDir dedicado para não colidir com o lock do .next/dev do workflow
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
