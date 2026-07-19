import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  loginAs,
  logout,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";

/**
 * Integração (J36) — G9 · Anúncios admin.
 *
 * Cobre `admin/anuncios/{anunciantes,campanhas(+[id]),config,pedidos(+[id]),kpi,zonas}`.
 * Guard uniforme: `requireVerifiedUser` + `isAdminLike` → anônimo 401, não-admin 403.
 *
 * Estratégia (ambiente compartilhado — não sujar):
 *   - AUTHZ transversal nos 8 endpoints (método representativo).
 *   - GETs admin → 200.
 *   - config PATCH — ler/gravar/restaurar (`secao:mercado-em-foco`) + chave inválida→400.
 *   - Ciclo CRUD descartável de campanha: cria anunciante "E2E" → cria campanha
 *     RASCUNHO sem orçamento (não lança receita no caixa) → GET reflete → PATCH →
 *     DELETE. + zona inválida→400.
 *   - pedidos/[id] PATCH é SÓ-AUTHZ (aprovar publica slots + notifica, irreversível):
 *     testa 401/403 + 404 com id fake, sem mutar pedido real.
 *
 * Nota: `anunciantes` não tem DELETE — o anunciante de teste ("E2E" no nome) fica
 * residual; é o mínimo necessário para a FK da campanha.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com joão, maria, admin.
 */

const ID_FAKE = "00000000-0000-0000-0000-000000000000";
// Zona válida que aceita o template default `imagem-card` (anuncios-service.ts).
const ZONA_OK = "sidebar-sup-contratante";

type Metodo = "GET" | "POST" | "PATCH" | "DELETE";
interface AuthzCase {
  path: string;
  method: Metodo;
  data?: Record<string, unknown>;
}

const AUTHZ: AuthzCase[] = [
  { path: "/api/admin/anuncios/anunciantes", method: "GET" },
  { path: "/api/admin/anuncios/campanhas", method: "GET" },
  { path: `/api/admin/anuncios/campanhas/${ID_FAKE}`, method: "PATCH", data: { titulo: "x" } },
  { path: "/api/admin/anuncios/config", method: "GET" },
  { path: "/api/admin/anuncios/kpi", method: "GET" },
  { path: "/api/admin/anuncios/pedidos", method: "GET" },
  { path: `/api/admin/anuncios/pedidos/${ID_FAKE}`, method: "PATCH", data: { acao: "aprovar" } },
  { path: "/api/admin/anuncios/zonas", method: "GET" },
];

async function chamar(request: APIRequestContext, c: AuthzCase) {
  switch (c.method) {
    case "GET":
      return request.get(c.path);
    case "POST":
      return request.post(c.path, { data: c.data ?? {} });
    case "PATCH":
      return request.patch(c.path, { data: c.data ?? {} });
    case "DELETE":
      return request.delete(c.path);
  }
}

test.describe.serial("Integração — G9 · Anúncios admin", () => {
  // ================= AUTHZ transversal ======================================

  test("anônimo → 401 em todos", async ({ request }) => {
    await logout(request);
    for (const c of AUTHZ) {
      const res = await chamar(request, c);
      expect(res.status(), `${c.method} ${c.path} anônimo deve ser 401`).toBe(401);
    }
  });

  for (const [rotulo, email] of [
    ["contratante", SEED_CONTRATANTE_EMAIL],
    ["empreiteiro", SEED_EMPREITEIRO_EMAIL],
  ] as const) {
    test(`${rotulo} (não-admin) → 403 em todos`, async ({ request }) => {
      await loginAs(request, email);
      for (const c of AUTHZ) {
        const res = await chamar(request, c);
        expect(res.status(), `${c.method} ${c.path} deve negar ${rotulo} com 403`).toBe(403);
        expect(res.status(), `${c.method} ${c.path} não pode vazar 500`).not.toBe(500);
      }
      await logout(request);
    });
  }

  // ================= GETs admin → 200 =======================================

  test("admin lê os GETs → 200", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    for (const path of [
      "/api/admin/anuncios/anunciantes",
      "/api/admin/anuncios/campanhas",
      "/api/admin/anuncios/config",
      "/api/admin/anuncios/kpi",
      "/api/admin/anuncios/pedidos",
      "/api/admin/anuncios/zonas",
    ]) {
      const res = await request.get(path);
      expect(res.status(), `admin GET ${path} deve ser 200`).toBe(200);
      expect(res.status(), `${path} não pode vazar 500`).not.toBe(500);
    }
    await logout(request);
  });

  // ================= config — PATCH ler/gravar/restaurar =====================

  test("config PATCH grava e reflete (restaura ao fim) + chave inválida→400", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const chave = "secao:mercado-em-foco";

    const antes = (await (await request.get("/api/admin/anuncios/config")).json()) as unknown;
    const valorOriginal = extrairVisivel(antes, chave);

    const novo = !valorOriginal;
    const patch = await request.patch("/api/admin/anuncios/config", {
      data: { chave, visivel: novo },
    });
    expect(patch.status(), "PATCH config deve ser 200").toBe(200);

    const depois = (await (await request.get("/api/admin/anuncios/config")).json()) as unknown;
    expect(extrairVisivel(depois, chave), "config deve refletir o novo valor").toBe(novo);

    // Restaura o valor original.
    await request.patch("/api/admin/anuncios/config", { data: { chave, visivel: valorOriginal } });

    // Chave inválida → 400.
    const inval = await request.patch("/api/admin/anuncios/config", {
      data: { chave: "chave-invalida-e2e", visivel: true },
    });
    expect(inval.status(), "chave inválida deve ser 400").toBe(400);
    await logout(request);
  });

  // ================= campanha — ciclo CRUD descartável ======================

  test("campanha: cria anunciante → cria campanha (rascunho) → GET reflete → PATCH → DELETE", async ({
    request,
  }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const stamp = Date.now().toString(36);

    // 1. Cria anunciante (FK da campanha). Sem DELETE — fica residual com "E2E".
    const anunc = await request.post("/api/admin/anuncios/anunciantes", {
      data: { nome: `E2E Anunciante ${stamp}` },
    });
    expect(anunc.status(), "criar anunciante deve ser 201").toBe(201);
    const anuncianteId = ((await anunc.json()) as { id: string }).id;
    expect(anuncianteId, "anunciante deve ter id").toBeTruthy();

    // 2. Cria campanha RASCUNHO sem orçamento (não lança receita).
    const camp = await request.post("/api/admin/anuncios/campanhas", {
      data: { anuncianteId, titulo: `E2E camp ${stamp}`, zona: ZONA_OK },
    });
    expect(camp.status(), "criar campanha deve ser 201").toBe(201);
    const campId = ((await camp.json()) as { id: string }).id;
    expect(campId, "campanha deve ter id").toBeTruthy();

    // 3. GET reflete.
    const list = (await (await request.get("/api/admin/anuncios/campanhas")).json()) as Array<{
      id: string;
    }>;
    expect(list.some((c) => c.id === campId), "campanha deve aparecer na listagem").toBeTruthy();

    // 4. PATCH título (sem tocar status/orçamento).
    const patch = await request.patch(`/api/admin/anuncios/campanhas/${campId}`, {
      data: { titulo: `E2E camp ${stamp} editado` },
    });
    expect(patch.status(), "PATCH campanha deve ser 200").toBe(200);

    // 5. Validação: zona inválida → 400.
    const inval = await request.post("/api/admin/anuncios/campanhas", {
      data: { anuncianteId, titulo: "E2E zona ruim", zona: "zona-inexistente-e2e" },
    });
    expect(inval.status(), "zona inválida deve ser 400").toBe(400);

    // 6. DELETE (hard) — cleanup da campanha.
    const del = await request.delete(`/api/admin/anuncios/campanhas/${campId}`);
    expect(del.status(), "DELETE campanha deve ser 200").toBe(200);

    // Já apagada → 404.
    const del2 = await request.delete(`/api/admin/anuncios/campanhas/${campId}`);
    expect(del2.status(), "campanha já apagada deve ser 404").toBe(404);
    await logout(request);
  });

  // ================= pedidos/[id] — SÓ-AUTHZ (irreversível) ==================

  test("pedidos/[id] PATCH: id inexistente → 404 (não materializa nada)", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    // Aprovar publica slots + notifica (irreversível) — só validamos que um id
    // inexistente é barrado com 404, sem tocar em pedido real.
    const res = await request.patch(`/api/admin/anuncios/pedidos/${ID_FAKE}`, {
      data: { acao: "aprovar" },
    });
    expect(res.status(), "pedido inexistente deve ser 404").toBe(404);
    await logout(request);
  });
});

/**
 * Extrai o booleano `visivel` de uma chave do payload de config, tolerante a
 * diferentes shapes (array de {chave,visivel} ou objeto {chave: boolean}).
 */
function extrairVisivel(payload: unknown, chave: string): boolean {
  if (Array.isArray(payload)) {
    const item = (payload as Array<{ chave?: string; visivel?: boolean }>).find(
      (i) => i.chave === chave,
    );
    return Boolean(item?.visivel);
  }
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const direct = obj[chave];
    if (typeof direct === "boolean") return direct;
    // shape { config: {...} } ou { rows: [...] }
    if (Array.isArray(obj.rows)) return extrairVisivel(obj.rows, chave);
    if (obj.config) return extrairVisivel(obj.config, chave);
  }
  return false;
}
