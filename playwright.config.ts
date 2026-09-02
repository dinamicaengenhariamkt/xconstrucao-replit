import { defineConfig, devices } from "@playwright/test";

// Garante que o gateway de pagamento seja sempre "manual" no processo do
// Playwright (runner + workers de globalSetup). O valor é propagado via herança
// de process.env ao processo filho do globalSetup, onde o guard verifica.
// O webServer também recebe PAYMENT_GATEWAY=manual em webServer.env (abaixo),
// cobrindo o processo do Next.js. Sem esta linha, PAYMENT_GATEWAY=asaas do
// ambiente de produção do Replit vazaria para o guard e abortaria a suíte.
process.env.PAYMENT_GATEWAY = "manual";

// Porta dedicada para os testes E2E (3010 por padrão), separada do workflow de
// desenvolvimento (5000). Pode ser sobrescrita via E2E_PORT.
//
// reuseExistingServer é sempre true: se um servidor E2E já estiver rodando
// na porta (ex.: run anterior que não foi encerrado), o Playwright o reutiliza
// em vez de falhar com EADDRINUSE. Para garantir um estado limpo com as envs
// corretas use `make test-e2e` ou `make test-e2e-aprovacao` — esses alvos matam
// qualquer processo legado na porta antes de chamar o Playwright.
const PORT = Number(process.env.E2E_PORT ?? 3010);
// Usa 127.0.0.1 (IPv4 explícito) para evitar EAFNOSUPPORT em ambientes onde
// "localhost" resolve para ::1 (IPv6) mas o servidor escuta apenas em IPv4.
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;
// O workspace fornece um Chromium com a mesma glibc do runtime Replit. Usá-lo
// evita depender de `playwright install` manual (e do binário empacotado pelo
// npm, que pode não iniciar sob o loader do workspace).
const BROWSER_EXECUTABLE = process.env.REPLIT_PLAYWRIGHT_CHROMIUM_EXECUTABLE;

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
    launchOptions: {
      executablePath: BROWSER_EXECUTABLE,
    },
  },
  projects: [
    // ── api ──────────────────────────────────────────────────────────────
    // Specs que falam só HTTP (`request`), sem abrir página. Rodam neste
    // ambiente, onde o Chromium do Playwright não sobe (`GLIBC_PRIVATE not
    // found` — ver docs/jornadas/37-testes-e2e.md §11).
    //
    // Antes existia um único project `chromium` cobrindo todo o testDir, e o
    // Playwright tentava lançar o browser mesmo para specs que não o usam:
    // `npm run test:e2e` morria no launch, e 4 specs API-only da raiz
    // (18 testes) ficavam órfãos — fora de `test:e2e` e de `test:integration`.
    {
      name: "api",
      testMatch: [
        "**/integration/**/*.spec.ts",
        // API-only da raiz: verificado por ausência de `page.` nos arquivos.
        "**/admin-real.spec.ts",
        "**/chat-ordering.spec.ts",
        "**/j21-comunicacao.spec.ts",
        "**/j41-xchat-completo.spec.ts",
        // Specs mistos: os testes de UI que eles contêm se auto-pulam via
        // `test.skip(!BROWSER_DISPONIVEL)`. Sem isto, os testes de API que
        // moram nesses arquivos — inclusive medição→pagamento — ficariam de
        // fora da suíte.
        "**/admin-aprovacao.spec.ts",
        "**/curadoria-warning.spec.ts",
        "**/j40-financeiro-totais.spec.ts",
      ],
    },
    // ── browser ──────────────────────────────────────────────────────────
    // Specs que navegam de verdade. Bloqueados neste ambiente; reentram na
    // fila quando houver runner com glibc consistente (Docker/CI externo).
    {
      name: "browser",
      testMatch: [
        "**/onboarding.spec.ts",
        "**/j03-nova-obra-aparece-imediato.spec.ts",
        "**/planos-redirect.spec.ts",
        "**/logout-xgestao.spec.ts",
        "**/xgestao-obras.browser.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Pré-sincroniza .next-e2e/dev com o cache do dev server (.next/dev) antes
    // de subir o servidor E2E. O rsync copia apenas diffs; quando o dev server
    // está rodando localmente o cache já está quente e o rsync termina em < 1 s.
    // Em ambientes sem .next/dev (checkout limpo), o rsync falha silenciosamente
    // (|| true) e o next dev compila do zero — funciona, só é mais lento.
    // NEXT_DIST_DIR=.next-e2e isola o E2E do lock do dev server na porta 5000.
    // A flag 2>/dev/null suprime o spam do warning de crypto (server/auth.ts
    // importado no Edge Runtime) que, sem filtro, cria backpressure no pipe do
    // playwright e aumenta muito o tempo de cada requisição de compilação.
    command: `bash -c 'rsync -a --exclude=lock .next/dev/ .next-e2e/dev/ 2>/dev/null || true; npx next dev -p ${PORT} -H 127.0.0.1 2>/dev/null'`,
    // /api/planos devolve 401 (sem compilar página completa).
    // Playwright 1.59 aceita qualquer status 200–403 como "servidor pronto".
    url: `${BASE_URL}/api/planos`,
    // Sempre reutiliza um servidor existente na porta — evita EADDRINUSE
    // tanto em CI (onde cada job começa limpo) quanto localmente.
    reuseExistingServer: true,
    // 300 s: cobre cold-start em checkout limpo (next dev sem cache).
    timeout: 300_000,
    env: {
      EMAIL_TEST_MODE: "1",
      E2E_TEST_AUTH: "1",
      NODE_ENV: "development",
      // distDir dedicado: não colide com o lock do .next/dev do workflow.
      NEXT_DIST_DIR: ".next-e2e",
      // Força o adapter manual para não chamar gateways reais em testes.
      PAYMENT_GATEWAY: "manual",
    },
  },
});
