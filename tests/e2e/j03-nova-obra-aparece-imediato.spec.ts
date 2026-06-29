import { test, expect } from "@playwright/test";

/**
 * Jornada 03 — Nova obra aparece imediatamente em Minhas Obras após criação.
 *
 * Reproduz a regressão de cache do Task #114: obras recém-criadas só
 * apareciam na lista após um reload manual porque a query do TanStack Query
 * não era invalidada depois do POST.
 *
 * O fix chama:
 *   queryClient.invalidateQueries({ queryKey: ['contratante', 'minhas-obras'] })
 * antes do router.push('/contratante/minhas-obras') na nova-obra page.
 *
 * Pré-requisitos: E2E_TEST_AUTH=1 (habilita /api/test/login-as e
 *   /api/test/cleanup-obras).
 */

const CONTRATANTE_EMAIL = "joao@construtora.com";
const BASE = "http://127.0.0.1:5000";

/**
 * Navega o browser para o helper GET /api/test/login-as que:
 *   1. Gera tokens JWT para o usuário
 *   2. Seta cookies sem secure:true (compatível com HTTP em dev)
 *   3. Redireciona para `to`
 */
async function loginAndGoto(page: import("@playwright/test").Page, to: string) {
  const params = new URLSearchParams({ email: CONTRATANTE_EMAIL, to });
  await page.goto(`/api/test/login-as?${params.toString()}`);
}

/**
 * Abre um Select shadcn/radix e clica na opção com o texto correspondente.
 */
async function selectOption(
  page: import("@playwright/test").Page,
  triggerTestId: string,
  optionText: string | RegExp
) {
  await page.getByTestId(triggerTestId).click();
  await page.locator('[role="option"]').filter({ hasText: optionText }).first().click();
}

/**
 * Preenche um input controlado pelo react-hook-form.
 * Usa pressSequentially (eventos de teclado reais) em vez de fill() para
 * garantir que o onChange do Controller dispare corretamente.
 */
async function fillInput(
  page: import("@playwright/test").Page,
  testId: string,
  value: string
) {
  const locator = page.getByTestId(testId);
  await locator.click();
  await locator.fill("");
  await locator.pressSequentially(value, { delay: 20 });
}

test.describe("Jornada 03 — Nova obra aparece imediatamente em Minhas Obras", () => {
  test.beforeEach(async () => {
    // Remove obras de teste de execuções anteriores para garantir que o
    // limite de plano (free = 1 obra aberta) não bloqueie a criação.
    const url = `${BASE}/api/test/cleanup-obras?email=${encodeURIComponent(CONTRATANTE_EMAIL)}`;
    await fetch(url, { method: "DELETE" }).catch(() => null);
  });

  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error(`[BROWSER] ${msg.text()}`);
      }
    });
  });

  test("Salvar rascunho: obra aparece na lista sem reload de página", async ({ page }) => {
    await loginAndGoto(page, "/contratante/nova-obra");
    await expect(page.getByTestId("card-identificacao")).toBeVisible({ timeout: 15_000 });

    const titulo = `Rascunho E2E ${Date.now()}`;

    await fillInput(page, "input-nome", titulo);
    await fillInput(page, "input-endereco", "Rua das Flores, 123, Apto 4");

    await page.getByTestId("button-salvar-rascunho").click();

    await page.waitForURL(/\/contratante\/minhas-obras/, { timeout: 30_000 });

    await expect(page.getByTestId("minhas-obras-contratante-page")).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText(titulo, { exact: false })
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Publicar obra: obra aparece na lista sem reload de página", async ({ page }) => {
    await loginAndGoto(page, "/contratante/nova-obra");
    await expect(page.getByTestId("card-identificacao")).toBeVisible({ timeout: 15_000 });

    const titulo = `Publicada E2E ${Date.now()}`;

    await fillInput(page, "input-nome", titulo);

    await selectOption(page, "select-tipo", "Residencial");

    await fillInput(
      page,
      "input-descricao",
      "Construção residencial padrão médio com três dormitórios e garagem dupla para família."
    );

    await fillInput(page, "input-endereco", "Avenida Paulista, 1000");
    await fillInput(page, "input-cidade", "São Paulo");

    await selectOption(page, "select-uf", "SP");
    await selectOption(page, "select-modalidade", /Administração/);
    await selectOption(page, "select-materiais", "Contratante");

    // CEP preenchido por último para minimizar race condition com ViaCEP autofill.
    await fillInput(page, "input-cep", "01310100");

    // Aguarda autofill do ViaCEP terminar (debounce 400ms) antes de publicar.
    await page.waitForTimeout(600);

    await page.getByTestId("button-publicar").click();

    await page.waitForURL(/\/contratante\/minhas-obras/, { timeout: 30_000 });

    await expect(page.getByTestId("minhas-obras-contratante-page")).toBeVisible({ timeout: 10_000 });

    await expect(
      page.getByText(titulo, { exact: false })
    ).toBeVisible({ timeout: 15_000 });
  });
});
