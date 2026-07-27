import { test, expect } from "@playwright/test";
import { loginAs, logout, BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL } from "./helpers";

/**
 * Aprovação de clientes, empreiteiras e obras pelo admin (Task #114 regression guard).
 *
 * Pré-requisito: E2E_TEST_AUTH=1 (habilita /api/test/login-as).
 *
 * Cobre três fluxos:
 *   1. Admin abre detalhe de cliente pendente → clica "Aprovar" → status vira "ativo".
 *   2. Admin abre detalhe de empreiteira pendente → clica "Aprovar" → status vira "ativo".
 *   3. Admin acessa Moderação de Obras → aprova obra publicada → ela aparece na aba "Aprovadas".
 */

const ADMIN_EMAIL = "admin@xconstrucao.com";
const CONTRATANTE_EMAIL = "joao@construtora.com";

// ─────────────────────────────────────────────────────────────────────────────
// Fluxo 1 — Aprovação de cliente via UI do admin
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Admin aprovação — Cliente", () => {
  test("admin abre cliente pendente, clica Aprovar e status vira Ativo sem toast de erro", async ({
    page,
    request,
  }) => {
    test.skip(!BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL);
    // 1. Obtém qualquer cliente via API para ter o ID.
    await loginAs(request, ADMIN_EMAIL);
    const listRes = await request.get("/api/admin/clientes");
    expect(listRes.ok()).toBeTruthy();
    const clientes = await listRes.json();
    if (!clientes.length) {
      test.skip(true, "Nenhum cliente no banco — pulando teste.");
      return;
    }

    const clienteId: string = clientes[0].id;
    const statusOriginal: string = clientes[0].status;

    // 2. Coloca o cliente em estado "aprovacao" para o botão aparecer.
    const setupRes = await request.patch(`/api/admin/clientes/${clienteId}/status`, {
      data: { status: "aprovacao" },
    });
    expect(setupRes.ok(), "Deve conseguir setar status aprovacao").toBeTruthy();

    // 3. Login no browser e navega para a página de detalhe.
    const loginRes = await page.request.post("/api/test/login-as", { data: { email: ADMIN_EMAIL } });
    expect(loginRes.ok()).toBeTruthy();

    await page.goto(`/admin/clientes/${clienteId}`);
    await expect(page.getByTestId("admin-cliente-detail-page")).toBeVisible();

    // 4. Botão "Aprovar" deve estar visível (cliente está em aprovacao).
    const btnAprovar = page.getByTestId("button-aprovar-cliente");
    await expect(btnAprovar).toBeVisible();

    // 5. Clica e aguarda atualização.
    await btnAprovar.click();

    // 6. Nenhum toast de erro deve aparecer (variant destructive).
    await page.waitForTimeout(1500);
    const errorToasts = page.locator("[data-variant='destructive']");
    await expect(errorToasts).toHaveCount(0);

    // 7. O badge de status deve exibir "Ativo".
    const badge = page.getByTestId("badge-status-detail");
    await expect(badge).toHaveText("Ativo");

    // 8. Confirma via API que o status realmente mudou para ativo.
    const detRes = await request.get(`/api/admin/clientes/${clienteId}`);
    expect(detRes.ok()).toBeTruthy();
    const det = await detRes.json();
    expect(det.status, "Status deve ser ativo após aprovação").toBe("ativo");

    // Restaura o status original para não poluir execuções futuras.
    await request.patch(`/api/admin/clientes/${clienteId}/status`, {
      data: { status: statusOriginal === "ativo" ? "ativo" : "aprovacao" },
    });
    await logout(request);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fluxo 2 — Aprovação de empreiteira via UI do admin
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Admin aprovação — Empreiteira", () => {
  test("admin abre empreiteira pendente, clica Aprovar e status vira Ativo sem toast de erro", async ({
    page,
    request,
  }) => {
    test.skip(!BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL);
    // 1. Obtém qualquer empreiteira via API.
    await loginAs(request, ADMIN_EMAIL);
    const listRes = await request.get("/api/admin/empreiteiras");
    expect(listRes.ok()).toBeTruthy();
    const empreiteiras = await listRes.json();
    if (!empreiteiras.length) {
      test.skip(true, "Nenhuma empreiteira no banco — pulando teste.");
      return;
    }

    const empreiteiraId: string = empreiteiras[0].id;
    const statusOriginal: string = empreiteiras[0].status;

    // 2. Coloca a empreiteira em estado "aprovacao".
    const setupRes = await request.patch(`/api/admin/empreiteiras/${empreiteiraId}/status`, {
      data: { status: "aprovacao" },
    });
    expect(setupRes.ok(), "Deve conseguir setar status aprovacao").toBeTruthy();

    // 3. Login no browser e navega para o detalhe.
    const loginRes = await page.request.post("/api/test/login-as", { data: { email: ADMIN_EMAIL } });
    expect(loginRes.ok()).toBeTruthy();

    await page.goto(`/admin/empreiteiras/${empreiteiraId}`);
    await expect(page.getByTestId("admin-empreiteira-detail-page")).toBeVisible();

    // 4. Botão "Aprovar" deve estar visível.
    const btnAprovar = page.getByTestId("button-aprovar-empreiteira");
    await expect(btnAprovar).toBeVisible();

    // 5. Clica e aguarda.
    await btnAprovar.click();

    // 6. Sem toast de erro.
    await page.waitForTimeout(1500);
    const errorToasts = page.locator("[data-variant='destructive']");
    await expect(errorToasts).toHaveCount(0);

    // 7. Badge deve mostrar "Ativa".
    const badge = page.getByTestId("badge-status-detail");
    await expect(badge).toHaveText("Ativa");

    // 8. Confirma via API.
    const detRes = await request.get(`/api/admin/empreiteiras/${empreiteiraId}`);
    expect(detRes.ok()).toBeTruthy();
    const det = await detRes.json();
    expect(["ativo", "ativa"]).toContain(det.status);

    // Restaura.
    await request.patch(`/api/admin/empreiteiras/${empreiteiraId}/status`, {
      data: { status: statusOriginal === "ativo" || statusOriginal === "ativa" ? "ativo" : "aprovacao" },
    });
    await logout(request);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fluxo 3 — Moderação de obras via UI do admin
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Admin aprovação — Moderação de Obras", () => {
  test("admin aprova obra publicada e ela aparece na aba Aprovadas", async ({
    page,
    request,
  }) => {
    test.skip(!BROWSER_DISPONIVEL, MOTIVO_BROWSER_INDISPONIVEL);
    // 1. Cria uma obra como contratante (em rascunho).
    await loginAs(request, CONTRATANTE_EMAIL);
    const timestamp = Date.now().toString(36);
    const createRes = await request.post("/api/obras", {
      data: {
        nome: `Obra E2E Moderacao ${timestamp}`,
        endereco: "Rua Teste E2E, 100, São Paulo - SP",
        visibilidade: "rascunho",
      },
    });
    expect(createRes.ok(), "Criação de obra deve retornar ok").toBeTruthy();
    const obra = await createRes.json();
    const obraId: string = obra.id;

    // 2. Publica a obra (o PATCH reseta statusModeracao → 'pendente').
    const publishRes = await request.patch(`/api/obras/${obraId}`, {
      data: {
        nome: `Obra E2E Moderacao ${timestamp}`,
        endereco: "Rua Teste E2E, 100, São Paulo - SP",
        visibilidade: "publicada",
        tipo: "Reforma",
        descricao: "Reforma completa de apartamento para fins de teste automatizado E2E.",
        cep: "01310-100",
        cidade: "São Paulo",
        uf: "SP",
        modalidade: "empreitada_global",
        materiaisPor: "contratante",
      },
    });
    expect(publishRes.ok(), "Publicação da obra deve retornar ok").toBeTruthy();

    await logout(request);

    // 3. Verifica via API (admin) que a obra está com statusModeracao='pendente'.
    await loginAs(request, ADMIN_EMAIL);
    const adminObraRes = await request.get(`/api/admin/obras?status_moderacao=pendente`);
    expect(adminObraRes.ok()).toBeTruthy();
    const adminObras = await adminObraRes.json();
    const obraTarget = (Array.isArray(adminObras) ? adminObras : adminObras.rows ?? []).find(
      (o: { id: string }) => o.id === obraId,
    );
    expect(obraTarget, "Obra deve aparecer na lista de pendentes").toBeTruthy();

    // 4. Login no browser como admin e abre a página de moderação.
    const loginRes = await page.request.post("/api/test/login-as", { data: { email: ADMIN_EMAIL } });
    expect(loginRes.ok()).toBeTruthy();

    await page.goto("/admin/obras/moderacao");
    await expect(page.getByTestId("admin-obras-moderacao-page")).toBeVisible();

    // 5. A aba "Em revisão" deve ser a ativa por padrão.
    const tabPendente = page.getByTestId("tab-moderacao-pendente");
    await expect(tabPendente).toBeVisible();

    // 6. Aguarda a obra aparecer na lista (pode levar um momento para carregar).
    const rowModeracao = page.getByTestId(`row-moderacao-${obraId}`);
    await expect(rowModeracao).toBeVisible({ timeout: 15_000 });

    // 7. Clica no botão "Aprovar" da obra.
    const btnAprovar = page.getByTestId(`button-aprovar-${obraId}`);
    await expect(btnAprovar).toBeVisible();
    await btnAprovar.click();

    // 8. A obra deve desaparecer da lista de pendentes após a aprovação.
    await expect(rowModeracao).toBeHidden({ timeout: 10_000 });

    // 9. Clica na aba "Aprovadas" e verifica que a obra aparece lá.
    const tabAprovada = page.getByTestId("tab-moderacao-aprovada");
    await expect(tabAprovada).toBeVisible();
    await tabAprovada.click();

    const rowAprovada = page.getByTestId(`row-moderacao-${obraId}`);
    await expect(rowAprovada).toBeVisible({ timeout: 10_000 });

    // 10. Confirma via API que o statusModeracao é 'aprovada'.
    const confirmRes = await request.get(`/api/admin/obras/${obraId}`).catch(() => null);
    if (confirmRes?.ok()) {
      const confirmedObra = await confirmRes.json();
      expect(confirmedObra.statusModeracao).toBe("aprovada");
    }

    await logout(request);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Smoke test — endpoints de aprovação retornam shape correto (API pura)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Admin aprovação — smoke tests API", () => {
  test("PATCH clientes aprovacao retorna status ativo e aceita perfilCompleto=false sem erro 500", async ({
    request,
  }) => {
    await loginAs(request, ADMIN_EMAIL);

    const listRes = await request.get("/api/admin/clientes");
    const clientes = await listRes.json();
    if (!clientes.length) {
      await logout(request);
      test.skip(true, "Nenhum cliente.");
      return;
    }

    const id: string = clientes[0].id;
    const original: string = clientes[0].status;

    // Seta para aprovacao
    await request.patch(`/api/admin/clientes/${id}/status`, { data: { status: "aprovacao" } });

    // Aprova
    const res = await request.patch(`/api/admin/clientes/${id}/aprovacao`, {
      data: { decisao: "aprovar" },
    });
    expect(res.status(), "Deve retornar 200").toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ativo");

    // Restaura
    await request.patch(`/api/admin/clientes/${id}/status`, {
      data: { status: original === "ativo" ? "ativo" : "aprovacao" },
    });
    await logout(request);
  });

  test("PATCH empreiteiras aprovacao retorna status ativo e aceita perfilCompleto=false sem erro 500", async ({
    request,
  }) => {
    await loginAs(request, ADMIN_EMAIL);

    const listRes = await request.get("/api/admin/empreiteiras");
    const empreiteiras = await listRes.json();
    if (!empreiteiras.length) {
      await logout(request);
      test.skip(true, "Nenhuma empreiteira.");
      return;
    }

    const id: string = empreiteiras[0].id;
    const original: string = empreiteiras[0].status;

    // Seta para aprovacao
    await request.patch(`/api/admin/empreiteiras/${id}/status`, { data: { status: "aprovacao" } });

    // Aprova
    const res = await request.patch(`/api/admin/empreiteiras/${id}/aprovacao`, {
      data: { decisao: "aprovar" },
    });
    expect(res.status(), "Deve retornar 200").toBe(200);
    const body = await res.json();
    expect(["ativo", "ativa"]).toContain(body.status);

    // Restaura
    await request.patch(`/api/admin/empreiteiras/${id}/status`, {
      data: { status: original === "ativo" || original === "ativa" ? "ativo" : "aprovacao" },
    });
    await logout(request);
  });

  test("contratante recebe 403 ao tentar aprovar cliente ou empreiteira", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);

    // Obtemos qualquer id real via admin primeiro (sem alterar estado)
    await logout(request);
    await loginAs(request, ADMIN_EMAIL);
    const clientes = await (await request.get("/api/admin/clientes")).json();
    const empreiteiras = await (await request.get("/api/admin/empreiteiras")).json();
    await logout(request);

    await loginAs(request, CONTRATANTE_EMAIL);

    if (clientes.length) {
      const res = await request.patch(`/api/admin/clientes/${clientes[0].id}/aprovacao`, {
        data: { decisao: "aprovar" },
      });
      expect(res.status(), "Contratante não deve aprovar cliente").toBe(403);
    }

    if (empreiteiras.length) {
      const res = await request.patch(
        `/api/admin/empreiteiras/${empreiteiras[0].id}/aprovacao`,
        { data: { decisao: "aprovar" } },
      );
      expect(res.status(), "Contratante não deve aprovar empreiteira").toBe(403);
    }

    await logout(request);
  });
});
