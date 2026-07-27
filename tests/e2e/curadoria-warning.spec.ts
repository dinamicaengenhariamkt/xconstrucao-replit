import { test, expect, type APIRequestContext, type Page } from "@playwright/test";
import { loginAs, logout, BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL } from "./helpers";

/**
 * Testes de regressão: aviso de perfil incompleto na curadoria admin.
 *
 * Cobre dois contratos:
 *
 * 1. API — o endpoint PATCH /api/admin/{clientes,empreiteiras}/[id]/aprovacao
 *    retorna `warning: "perfil_incompleto"` quando o perfil está incompleto e
 *    NÃO retorna esse campo quando o perfil está completo.
 *
 * 2. UI (browser) — o admin vê o toast amarelo de aviso ao aprovar um usuário
 *    com perfil incompleto, e o toast verde/padrão ao aprovar um usuário com
 *    perfil completo.
 *
 * Pré-requisito: E2E_TEST_AUTH=1 (habilita /api/test/login-as e
 *                /api/test/curadoria-setup).
 */

const ADMIN_EMAIL = "admin@xconstrucao.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Configura perfilCompleto e status de um cliente ou empreiteira via endpoint
 * test-only. Deve ser chamado ANTES de qualquer mutação de curadoria no teste.
 */
async function setupCuradoria(
  request: APIRequestContext,
  entity: "cliente" | "empreiteira",
  id: string,
  opts: { perfilCompleto: boolean; status: "aprovacao" | "ativo" | "inativo" }
) {
  const res = await request.post("/api/test/curadoria-setup", {
    data: { entity, id, ...opts },
  });
  expect(
    res.ok(),
    `curadoria-setup ${entity} ${id} deve responder ok (status ${res.status()})`
  ).toBeTruthy();
}

async function firstAprovacaoId(
  request: APIRequestContext,
  path: string
): Promise<string | null> {
  const res = await request.get(path);
  if (!res.ok()) return null;
  const items = await res.json();
  if (!Array.isArray(items) || items.length === 0) return null;
  const found = items.find((i: { id: string }) => i.id);
  return found?.id ?? null;
}

// ── API — Clientes ────────────────────────────────────────────────────────────

test.describe("API — cliente incompleto/completo", () => {
  test("perfil incompleto → retorna warning perfil_incompleto", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const id = await firstAprovacaoId(request, "/api/admin/clientes");
    if (!id) {
      console.warn("Nenhum cliente encontrado — pulando teste");
      await logout(request);
      return;
    }

    // Garante: perfil incompleto + status aprovacao
    await setupCuradoria(request, "cliente", id, {
      perfilCompleto: false,
      status: "aprovacao",
    });

    const res = await request.patch(`/api/admin/clientes/${id}/aprovacao`, {
      data: { decisao: "aprovar" },
    });
    expect(res.ok(), "aprovação deve ter sucesso").toBeTruthy();
    const body = await res.json();

    expect(body.warning, "campo warning deve ser retornado").toBe("perfil_incompleto");
    expect(typeof body.warningMessage, "warningMessage deve ser string").toBe("string");
    expect(body.warningMessage.length, "warningMessage não pode ser vazio").toBeGreaterThan(0);

    // Restaura
    await setupCuradoria(request, "cliente", id, { perfilCompleto: false, status: "aprovacao" });
    await logout(request);
  });

  test("perfil completo → NÃO retorna warning", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const id = await firstAprovacaoId(request, "/api/admin/clientes");
    if (!id) {
      console.warn("Nenhum cliente encontrado — pulando teste");
      await logout(request);
      return;
    }

    // Garante: perfil completo + status aprovacao
    await setupCuradoria(request, "cliente", id, {
      perfilCompleto: true,
      status: "aprovacao",
    });

    const res = await request.patch(`/api/admin/clientes/${id}/aprovacao`, {
      data: { decisao: "aprovar" },
    });
    expect(res.ok(), "aprovação deve ter sucesso").toBeTruthy();
    const body = await res.json();

    expect(
      body.warning,
      "warning NÃO deve ser retornado quando perfil está completo"
    ).toBeUndefined();

    // Restaura
    await setupCuradoria(request, "cliente", id, { perfilCompleto: false, status: "aprovacao" });
    await logout(request);
  });

  test("reprovar não retorna warning mesmo com perfil incompleto", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const id = await firstAprovacaoId(request, "/api/admin/clientes");
    if (!id) {
      await logout(request);
      return;
    }

    await setupCuradoria(request, "cliente", id, {
      perfilCompleto: false,
      status: "aprovacao",
    });

    const res = await request.patch(`/api/admin/clientes/${id}/aprovacao`, {
      data: { decisao: "reprovar" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.warning, "reprovar nunca deve emitir warning").toBeUndefined();

    // Restaura
    await setupCuradoria(request, "cliente", id, { perfilCompleto: false, status: "aprovacao" });
    await logout(request);
  });
});

// ── API — Empreiteiras ────────────────────────────────────────────────────────

test.describe("API — empreiteira incompleta/completa", () => {
  test("perfil incompleto → retorna warning perfil_incompleto", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const id = await firstAprovacaoId(request, "/api/admin/empreiteiras");
    if (!id) {
      console.warn("Nenhuma empreiteira encontrada — pulando teste");
      await logout(request);
      return;
    }

    await setupCuradoria(request, "empreiteira", id, {
      perfilCompleto: false,
      status: "aprovacao",
    });

    const res = await request.patch(`/api/admin/empreiteiras/${id}/aprovacao`, {
      data: { decisao: "aprovar" },
    });
    expect(res.ok(), "aprovação empreiteira deve ter sucesso").toBeTruthy();
    const body = await res.json();

    expect(body.warning, "campo warning deve ser retornado").toBe("perfil_incompleto");
    expect(typeof body.warningMessage).toBe("string");
    expect(body.warningMessage.length).toBeGreaterThan(0);

    // Restaura
    await setupCuradoria(request, "empreiteira", id, { perfilCompleto: false, status: "aprovacao" });
    await logout(request);
  });

  test("perfil completo → NÃO retorna warning", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const id = await firstAprovacaoId(request, "/api/admin/empreiteiras");
    if (!id) {
      console.warn("Nenhuma empreiteira encontrada — pulando teste");
      await logout(request);
      return;
    }

    await setupCuradoria(request, "empreiteira", id, {
      perfilCompleto: true,
      status: "aprovacao",
    });

    const res = await request.patch(`/api/admin/empreiteiras/${id}/aprovacao`, {
      data: { decisao: "aprovar" },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();

    expect(
      body.warning,
      "warning NÃO deve ser retornado quando perfil está completo"
    ).toBeUndefined();

    // Restaura
    await setupCuradoria(request, "empreiteira", id, { perfilCompleto: false, status: "aprovacao" });
    await logout(request);
  });
});

// ── UI — Toast de aviso (browser) ────────────────────────────────────────────
//
// IMPORTANTE: nas suítes de browser (page), usamos `page.request` (em vez do
// fixture `request` standalone) para que os cookies de autenticação sejam
// compartilhados com o contexto do browser. O fixture `request` tem um
// cookie jar independente do `page`.

async function pageLoginAs(page: Page, email: string) {
  const res = await page.request.post("/api/test/login-as", {
    data: { email },
  });
  expect(res.ok(), `page.request login-as ${email} deve ser ok`).toBeTruthy();
}

async function pageSetupCuradoria(
  page: Page,
  entity: "cliente" | "empreiteira",
  id: string,
  opts: { perfilCompleto: boolean; status: "aprovacao" | "ativo" | "inativo" }
) {
  const res = await page.request.post("/api/test/curadoria-setup", {
    data: { entity, id, ...opts },
  });
  expect(res.ok(), `page curadoria-setup ${entity} ${id} deve ser ok`).toBeTruthy();
}

async function pageFirstAprovacaoId(
  page: Page,
  apiPath: string
): Promise<string | null> {
  const res = await page.request.get(apiPath);
  if (!res.ok()) return null;
  const items = (await res.json()) as Array<{ id: string }>;
  return items[0]?.id ?? null;
}

test.describe("UI — toast de curadoria (cliente)", () => {
  test("toast amarelo ao aprovar cliente com perfil incompleto", async ({ page }) => {
    test.skip(!BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL);
    await pageLoginAs(page, ADMIN_EMAIL);

    const id = await pageFirstAprovacaoId(page, "/api/admin/clientes");
    if (!id) {
      console.warn("Nenhum cliente — pulando teste UI incompleto");
      return;
    }

    await pageSetupCuradoria(page, "cliente", id, {
      perfilCompleto: false,
      status: "aprovacao",
    });

    await page.goto(`/admin/clientes/${id}`);

    const approveBtn = page.getByTestId("button-aprovar-cliente");
    await approveBtn.waitFor({ state: "visible", timeout: 20_000 });
    await approveBtn.click();

    // Toast amarelo: contém "perfil" e "incompleto" na descrição
    const yellowToast = page
      .locator("[role='status'], [role='alert'], li[data-state]")
      .filter({ hasText: /perfil.*incompleto|incompleto.*perfil/i })
      .first();
    await yellowToast.waitFor({ state: "visible", timeout: 10_000 });
    await expect(yellowToast).toBeVisible();

    // Restaura
    await pageSetupCuradoria(page, "cliente", id, { perfilCompleto: false, status: "aprovacao" });
  });

  test("toast padrão ao aprovar cliente com perfil completo", async ({ page }) => {
    test.skip(!BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL);
    await pageLoginAs(page, ADMIN_EMAIL);

    const id = await pageFirstAprovacaoId(page, "/api/admin/clientes");
    if (!id) {
      console.warn("Nenhum cliente — pulando teste UI completo");
      return;
    }

    await pageSetupCuradoria(page, "cliente", id, {
      perfilCompleto: true,
      status: "aprovacao",
    });

    await page.goto(`/admin/clientes/${id}`);

    const approveBtn = page.getByTestId("button-aprovar-cliente");
    await approveBtn.waitFor({ state: "visible", timeout: 20_000 });
    await approveBtn.click();

    // Toast de sucesso normal: contém "ativo na plataforma"
    const successToast = page
      .locator("[role='status'], [role='alert'], li[data-state]")
      .filter({ hasText: /ativo na plataforma/i })
      .first();
    await successToast.waitFor({ state: "visible", timeout: 10_000 });
    await expect(successToast).toBeVisible();

    // NÃO deve aparecer o toast de perfil incompleto (sem falso positivo)
    const warningToast = page
      .locator("[role='status'], [role='alert'], li[data-state]")
      .filter({ hasText: /perfil.*incompleto/i });
    await expect(warningToast).not.toBeVisible();

    // Restaura
    await pageSetupCuradoria(page, "cliente", id, { perfilCompleto: false, status: "aprovacao" });
  });
});

test.describe("UI — toast de curadoria (empreiteira)", () => {
  test("toast amarelo ao aprovar empreiteira com perfil incompleto", async ({ page }) => {
    test.skip(!BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL);
    await pageLoginAs(page, ADMIN_EMAIL);

    const id = await pageFirstAprovacaoId(page, "/api/admin/empreiteiras");
    if (!id) {
      console.warn("Nenhuma empreiteira — pulando teste UI incompleto");
      return;
    }

    await pageSetupCuradoria(page, "empreiteira", id, {
      perfilCompleto: false,
      status: "aprovacao",
    });

    await page.goto(`/admin/empreiteiras/${id}`);

    const approveBtn = page.getByTestId("button-aprovar-empreiteira");
    await approveBtn.waitFor({ state: "visible", timeout: 20_000 });
    await approveBtn.click();

    const yellowToast = page
      .locator("[role='status'], [role='alert'], li[data-state]")
      .filter({ hasText: /perfil.*incompleto|incompleto.*perfil/i })
      .first();
    await yellowToast.waitFor({ state: "visible", timeout: 10_000 });
    await expect(yellowToast).toBeVisible();

    // Restaura
    await pageSetupCuradoria(page, "empreiteira", id, { perfilCompleto: false, status: "aprovacao" });
  });

  test("toast padrão ao aprovar empreiteira com perfil completo", async ({ page }) => {
    test.skip(!BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL);
    await pageLoginAs(page, ADMIN_EMAIL);

    const id = await pageFirstAprovacaoId(page, "/api/admin/empreiteiras");
    if (!id) {
      console.warn("Nenhuma empreiteira — pulando teste UI completo");
      return;
    }

    await pageSetupCuradoria(page, "empreiteira", id, {
      perfilCompleto: true,
      status: "aprovacao",
    });

    await page.goto(`/admin/empreiteiras/${id}`);

    const approveBtn = page.getByTestId("button-aprovar-empreiteira");
    await approveBtn.waitFor({ state: "visible", timeout: 20_000 });
    await approveBtn.click();

    // Toast de sucesso: "ativa na plataforma"
    const successToast = page
      .locator("[role='status'], [role='alert'], li[data-state]")
      .filter({ hasText: /ativa na plataforma/i })
      .first();
    await successToast.waitFor({ state: "visible", timeout: 10_000 });
    await expect(successToast).toBeVisible();

    // Sem falso positivo
    const warningToast = page
      .locator("[role='status'], [role='alert'], li[data-state]")
      .filter({ hasText: /perfil.*incompleto/i });
    await expect(warningToast).not.toBeVisible();

    // Restaura
    await pageSetupCuradoria(page, "empreiteira", id, { perfilCompleto: false, status: "aprovacao" });
  });
});
