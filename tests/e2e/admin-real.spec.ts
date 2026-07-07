import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Admin real (Clientes, Empreiteiras, FAQ, Auditoria) — endpoints que antes só
 * existiam como mock e agora são servidos do Postgres.
 * Pré-requisito: E2E_TEST_AUTH=1 (habilita /api/test/login-as).
 *
 * Valida:
 *   - guards: contratante recebe 403 em todos os GET /api/admin/* novos
 *   - admin: FAQ não-vazio; auditoria kpi/eventos com shape certo;
 *     clientes/empreiteiras listam e detalham com agregados numéricos
 *   - round-trip de mutação: PATCH status → GET reflete + historicoBloqueios
 */

const ADMIN_EMAIL = "admin@xconstrucao.com";
const CONTRATANTE_EMAIL = "joao@construtora.com"; // seed — role contratante

async function loginAs(request: APIRequestContext, email: string) {
  const res = await request.post("/api/test/login-as", { data: { email } });
  expect(res.ok(), `login-as ${email} deve responder ok`).toBeTruthy();
}
async function logout(request: APIRequestContext) {
  await request.post("/api/auth/logout").catch(() => {});
}

const ADMIN_GET_ENDPOINTS = [
  "/api/admin/faq",
  "/api/admin/auditoria/kpi",
  "/api/admin/auditoria/eventos",
  "/api/admin/clientes",
  "/api/admin/empreiteiras",
];

test.describe("Admin real — guards", () => {
  test("contratante recebe 403 em todos os GET admin novos", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);
    for (const url of ADMIN_GET_ENDPOINTS) {
      const res = await request.get(url);
      expect(res.status(), `${url} deve negar contratante`).toBe(403);
    }
    await logout(request);
  });
});

test.describe("Admin real — FAQ e Auditoria", () => {
  test("FAQ retorna itens reais do banco", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);
    const res = await request.get("/api/admin/faq");
    expect(res.ok()).toBeTruthy();
    const items = await res.json();
    expect(Array.isArray(items)).toBeTruthy();
    expect(items.length).toBeGreaterThan(0);
    const first = items[0];
    expect(first).toHaveProperty("question");
    expect(first).toHaveProperty("answer");
    expect(first).toHaveProperty("category");
    expect(["contratante", "empreiteiro", "ambos"]).toContain(first.visao);
    await logout(request);
  });

  test("auditoria kpi e eventos têm shape esperado", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const kpiRes = await request.get("/api/admin/auditoria/kpi");
    expect(kpiRes.ok()).toBeTruthy();
    const kpi = await kpiRes.json();
    for (const k of ["acoesHoje", "loginsHoje", "alertas", "erros"]) {
      expect(typeof kpi[k], `kpi.${k} numérico`).toBe("number");
    }

    const evRes = await request.get("/api/admin/auditoria/eventos");
    expect(evRes.ok()).toBeTruthy();
    const eventos = await evRes.json();
    expect(Array.isArray(eventos)).toBeTruthy();
    if (eventos.length) {
      expect(eventos[0]).toHaveProperty("tipo");
      expect(eventos[0]).toHaveProperty("modulo");
      expect(eventos[0]).toHaveProperty("usuario");
    }
    await logout(request);
  });
});

test.describe("Admin real — Clientes", () => {
  test("lista e detalha clientes com agregados numéricos", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const listRes = await request.get("/api/admin/clientes");
    expect(listRes.ok()).toBeTruthy();
    const clientes = await listRes.json();
    expect(Array.isArray(clientes)).toBeTruthy();
    if (clientes.length === 0) {
      await logout(request);
      return;
    }

    const id = clientes[0].id;
    const detRes = await request.get(`/api/admin/clientes/${id}`);
    expect(detRes.ok()).toBeTruthy();
    const det = await detRes.json();
    expect(typeof det.totalObras).toBe("number");
    expect(typeof det.valorTotalPago).toBe("number");
    expect(["pessoa_fisica", "pessoa_juridica"]).toContain(det.tipo);

    for (const sub of ["obras", "financeiro", "atividades", "documentos"]) {
      const r = await request.get(`/api/admin/clientes/${id}/${sub}`);
      expect(r.ok(), `GET /clientes/${id}/${sub}`).toBeTruthy();
    }
    await logout(request);
  });

  test("round-trip de bloqueio reflete em historicoBloqueios", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);
    const clientes = await (await request.get("/api/admin/clientes")).json();
    if (!clientes.length) {
      await logout(request);
      return;
    }
    const id = clientes[0].id;

    const patch = await request.patch(`/api/admin/clientes/${id}/status`, {
      data: { status: "inativo", motivo: "Teste e2e" },
    });
    expect(patch.ok()).toBeTruthy();

    const det = await (await request.get(`/api/admin/clientes/${id}`)).json();
    expect(det.status).toBe("inativo");
    expect(Array.isArray(det.historicoBloqueios)).toBeTruthy();
    expect(det.historicoBloqueios.some((h: { tipo: string }) => h.tipo === "bloqueio")).toBeTruthy();

    // Restaura para não sujar o seed entre execuções.
    await request.patch(`/api/admin/clientes/${id}/status`, { data: { status: "ativo" } });
    await logout(request);
  });
});

test.describe("Admin real — Empreiteiras", () => {
  test("lista e detalha empreiteiras com agregados", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);

    const listRes = await request.get("/api/admin/empreiteiras");
    expect(listRes.ok()).toBeTruthy();
    const empreiteiras = await listRes.json();
    expect(Array.isArray(empreiteiras)).toBeTruthy();
    if (empreiteiras.length === 0) {
      await logout(request);
      return;
    }

    const id = empreiteiras[0].id;
    const det = await (await request.get(`/api/admin/empreiteiras/${id}`)).json();
    expect(typeof det.totalObras).toBe("number");
    expect(typeof det.obrasEmAndamento).toBe("number");
    expect(typeof det.valorTotalRecebido).toBe("number");

    const obras = await request.get(`/api/admin/empreiteiras/${id}/obras`);
    expect(obras.ok()).toBeTruthy();
    await logout(request);
  });
});
