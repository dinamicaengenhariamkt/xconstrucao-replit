import { test, expect } from "@playwright/test";

/**
 * Jornada — Redirecionamento pós-cancelamento em /planos.
 *
 * A página /planos lê /api/auth/me e redireciona:
 *   - contratante  → /contratante/planos
 *   - empreiteiro  → /empreiteiro/planos
 *   - admin / sem login → exibe os dois botões (sem redirect)
 *
 * Requer:
 *   - E2E_TEST_AUTH=1   (habilita /api/test/login-as)
 *   - Contas seed: joao@construtora.com, maria@empreiteira.com, admin@xconstrucao.com
 */

test.describe("Redirecionamento /planos por persona", () => {
  test("sem login: exibe os dois botões, sem redirect", async ({ page }) => {
    await page.goto("/planos");
    await expect(page.getByTestId("planos-cancelamento-page")).toBeVisible();
    await expect(page.getByTestId("link-ver-planos-contratante")).toBeVisible();
    await expect(page.getByTestId("link-ver-planos-empreiteiro")).toBeVisible();
    await expect(page).toHaveURL(/\/planos/);
  });

  test("contratante: /planos redireciona para /contratante/planos", async ({ page }) => {
    const loginAs = await page.request.post("/api/test/login-as", {
      data: { email: "joao@construtora.com" },
    });
    expect(loginAs.ok()).toBeTruthy();
    const body = await loginAs.json();
    expect(body.user.role).toBe("contratante");

    await page.goto("/planos");
    await expect(page).toHaveURL(/\/contratante\/planos/, { timeout: 15_000 });
  });

  test("empreiteiro: /planos redireciona para /empreiteiro/planos", async ({ page }) => {
    const loginAs = await page.request.post("/api/test/login-as", {
      data: { email: "maria@empreiteira.com" },
    });
    expect(loginAs.ok()).toBeTruthy();
    const body = await loginAs.json();
    expect(body.user.role).toBe("empreiteiro");

    await page.goto("/planos");
    await expect(page).toHaveURL(/\/empreiteiro\/planos/, { timeout: 15_000 });
  });

  test("admin: /planos exibe os dois botões, sem redirect", async ({ page }) => {
    const loginAs = await page.request.post("/api/test/login-as", {
      data: { email: "admin@xconstrucao.com" },
    });
    expect(loginAs.ok()).toBeTruthy();
    const body = await loginAs.json();
    expect(["admin", "superadmin"].includes(body.user.role)).toBeTruthy();

    await page.goto("/planos");
    await expect(page.getByTestId("planos-cancelamento-page")).toBeVisible();
    await expect(page.getByTestId("link-ver-planos-contratante")).toBeVisible();
    await expect(page.getByTestId("link-ver-planos-empreiteiro")).toBeVisible();
    await expect(page).toHaveURL(/\/planos/);
  });
});
