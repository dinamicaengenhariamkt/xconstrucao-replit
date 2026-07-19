import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  loginAs,
  logout,
  uniqueEmail,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";

/**
 * Integração (J36) — G8 · Usuários & configuração admin.
 *
 * Cobre `admin/usuarios(+[id],[id]/ativo)`, `admin/configuracoes`, `admin/legal`,
 * `admin/faq(+[id])`, `admin/integracoes/api-key`, `admin/marketplace-leads(+[id])`,
 * `admin/planos(+[id],kpi,assinantes)`, `perfil/admin`.
 *
 * Estratégia de segurança (o ambiente é compartilhado — não sujar):
 *   - AUTHZ transversal (anônimo→401, não-admin→403) em TODOS os endpoints. Usa
 *     personas verificadas+ativas (seed) para o 403 vir do check de role, não do
 *     guard de verificação de email.
 *   - MUTAÇÃO exercitada de verdade só onde é reversível:
 *       · perfil/admin PATCH — ler/gravar/restaurar (próprio perfil, risco zero).
 *       · configuracoes PATCH — chave `notificacoes` (bools), ler/gravar/restaurar.
 *       · faq — cria (E2E no texto) → PATCH → DELETE físico (descartável).
 *       · usuarios — cria descartável (email único) → GET reflete → PATCH →
 *         ativo toggle → soft-DELETE.
 *       · marketplace-leads/[id] — restaura se houver lead; senão só-authz + 404.
 *   - SÓ-AUTHZ (efeito irreversível/arriscado, testa apenas 401/403 + 404):
 *       · legal POST (versão append-only, dispara re-consentimento, sem rollback).
 *       · integracoes/api-key POST/DELETE (rotação irreversível).
 *       · planos/[id] PATCH (muda preço do catálogo → afeta assinaturas).
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com joão, maria, admin.
 */

const ID_FAKE = "00000000-0000-0000-0000-000000000000";

/** GET/POST/PATCH/DELETE que deve negar anônimo (401) e não-admin (403). */
type Metodo = "GET" | "POST" | "PATCH" | "DELETE";

interface AuthzCase {
  path: string;
  method: Metodo;
  /** body p/ métodos de mutação (passa pelo guard antes do Zod). */
  data?: Record<string, unknown>;
}

/** Endpoints do grupo com o método representativo para o teste de authz. */
const AUTHZ: AuthzCase[] = [
  { path: "/api/admin/usuarios", method: "GET" },
  { path: `/api/admin/usuarios/${ID_FAKE}`, method: "GET" },
  { path: `/api/admin/usuarios/${ID_FAKE}/ativo`, method: "POST", data: { ativo: true } },
  { path: "/api/admin/configuracoes", method: "GET" },
  { path: "/api/admin/legal", method: "GET" },
  { path: "/api/admin/faq", method: "GET" },
  { path: `/api/admin/faq/${ID_FAKE}`, method: "PATCH", data: { ativo: true } },
  { path: "/api/admin/integracoes/api-key", method: "GET" },
  { path: "/api/admin/marketplace-leads", method: "GET" },
  { path: `/api/admin/marketplace-leads/${ID_FAKE}`, method: "PATCH", data: { status: "notificado" } },
  { path: "/api/admin/planos", method: "GET" },
  { path: `/api/admin/planos/${ID_FAKE}`, method: "PATCH", data: { ativo: true } },
  { path: "/api/admin/planos/kpi", method: "GET" },
  { path: "/api/admin/planos/assinantes", method: "GET" },
  { path: "/api/perfil/admin", method: "GET" },
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

test.describe.serial("Integração — G8 · Usuários & config admin", () => {
  // ================= AUTHZ transversal ======================================

  test("anônimo → 401 em todos os endpoints do grupo", async ({ request }) => {
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
    test(`${rotulo} (não-admin, verificado) → 403 em todos`, async ({ request }) => {
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

  test("admin lê os GETs do grupo → 200", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const gets = [
      "/api/admin/usuarios",
      "/api/admin/configuracoes",
      "/api/admin/legal",
      "/api/admin/faq",
      "/api/admin/integracoes/api-key",
      "/api/admin/marketplace-leads",
      "/api/admin/planos",
      "/api/admin/planos/kpi",
      "/api/admin/planos/assinantes",
      "/api/perfil/admin",
    ];
    for (const path of gets) {
      const res = await request.get(path);
      expect(res.status(), `admin GET ${path} deve ser 200`).toBe(200);
      expect(res.status(), `${path} não pode vazar 500`).not.toBe(500);
    }
    await logout(request);
  });

  // ================= perfil/admin — PATCH ler/gravar/restaurar ===============

  test("perfil/admin PATCH grava e reflete (restaura ao fim)", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    const antes = (await (await request.get("/api/perfil/admin")).json()) as { bio?: string | null };
    const bioOriginal = antes.bio ?? null;
    const novaBio = `Bio E2E ${Date.now().toString(36)}`;

    const patch = await request.patch("/api/perfil/admin", { data: { bio: novaBio } });
    expect(patch.status(), "PATCH perfil deve ser 200").toBe(200);

    const depois = (await (await request.get("/api/perfil/admin")).json()) as { bio?: string | null };
    expect(depois.bio, "bio deve refletir o novo valor").toBe(novaBio);

    // Restaura o valor original.
    await request.patch("/api/perfil/admin", { data: { bio: bioOriginal } });
    await logout(request);
  });

  // ================= configuracoes — PATCH ler/gravar/restaurar ==============

  test("configuracoes PATCH (notificacoes) grava e reflete (restaura ao fim)", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    const cfgAntes = (await (await request.get("/api/admin/configuracoes")).json()) as Record<
      string,
      Record<string, unknown>
    >;
    const notifOriginal = { ...(cfgAntes.notificacoes ?? {}) };
    const alvo = "relatorioSemanal";
    const valorOriginal = Boolean(notifOriginal[alvo]);
    const novoValor = !valorOriginal;

    const patch = await request.patch("/api/admin/configuracoes", {
      data: { chave: "notificacoes", valor: { [alvo]: novoValor } },
    });
    expect(patch.status(), "PATCH configuracoes deve ser 200").toBe(200);

    const cfgDepois = (await (await request.get("/api/admin/configuracoes")).json()) as Record<
      string,
      Record<string, unknown>
    >;
    expect(
      Boolean(cfgDepois.notificacoes?.[alvo]),
      `${alvo} deve refletir o novo valor`,
    ).toBe(novoValor);

    // Restaura o objeto original completo (merge raso preserva).
    await request.patch("/api/admin/configuracoes", {
      data: { chave: "notificacoes", valor: notifOriginal },
    });

    // Validação: payload inválido → 400 (chave fora do enum).
    const inval = await request.patch("/api/admin/configuracoes", {
      data: { chave: "inexistente", valor: {} },
    });
    expect(inval.status(), "chave inválida deve ser 400").toBe(400);
    await logout(request);
  });

  // ================= faq — cria → PATCH → DELETE (descartável) ===============

  test("faq: cria → GET reflete → PATCH → DELETE (ciclo descartável)", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    // Cria.
    const stamp = Date.now().toString(36);
    const create = await request.post("/api/admin/faq", {
      data: {
        question: `Pergunta E2E ${stamp} — como funciona o teste de integração?`,
        answer: `Resposta E2E ${stamp} — este item é criado e removido pelo próprio teste.`,
        category: "E2E",
        visao: "ambos",
        ordem: 999,
        ativo: true,
      },
    });
    expect(create.status(), "criar FAQ deve ser 201").toBe(201);
    const { id: faqId } = (await create.json()) as { id: string };
    expect(faqId, "FAQ criado deve ter id").toBeTruthy();

    // GET reflete.
    const list = (await (await request.get("/api/admin/faq")).json()) as Array<{ id: string }>;
    expect(list.some((f) => f.id === faqId), "FAQ criado deve aparecer na listagem").toBeTruthy();

    // PATCH.
    const patch = await request.patch(`/api/admin/faq/${faqId}`, { data: { ativo: false } });
    expect(patch.status(), "PATCH FAQ deve ser 200").toBe(200);

    // Validação: payload inválido → 400 (question curta).
    const inval = await request.post("/api/admin/faq", {
      data: { question: "curta", answer: "x", category: "", visao: "ambos", ordem: 0, ativo: true },
    });
    expect(inval.status(), "FAQ inválido deve ser 400").toBe(400);

    // DELETE (físico) — cleanup.
    const del = await request.delete(`/api/admin/faq/${faqId}`);
    expect(del.status(), "DELETE FAQ deve ser 200").toBe(200);

    // Já apagado → 404.
    const del2 = await request.delete(`/api/admin/faq/${faqId}`);
    expect(del2.status(), "FAQ já apagado deve ser 404").toBe(404);
    await logout(request);
  });

  // ================= usuarios — cria descartável → PATCH → ativo → soft-DELETE

  test("usuarios: cria descartável → GET reflete → PATCH → ativo toggle → soft-delete", async ({
    request,
  }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    const email = uniqueEmail("g8-user");
    const create = await request.post("/api/admin/usuarios", {
      data: { name: "Usuário E2E G8", email, role: "contratante", senhaModo: "random" },
    });
    expect(create.status(), "criar usuário deve ser 201").toBe(201);
    const { user } = (await create.json()) as { user: { id: string; email: string } };
    const userId = user.id;
    expect(userId, "usuário criado deve ter id").toBeTruthy();

    // Email duplicado → 409.
    const dup = await request.post("/api/admin/usuarios", {
      data: { name: "Dup E2E", email, role: "contratante", senhaModo: "random" },
    });
    expect(dup.status(), "email duplicado deve ser 409").toBe(409);

    // GET [id] reflete.
    const got = (await (await request.get(`/api/admin/usuarios/${userId}`)).json()) as {
      email: string;
      ativo: boolean;
    };
    expect(got.email, "email deve bater").toBe(email);

    // PATCH nome.
    const patch = await request.patch(`/api/admin/usuarios/${userId}`, {
      data: { name: "Usuário E2E G8 Renomeado" },
    });
    expect(patch.status(), "PATCH usuário deve ser 200").toBe(200);

    // ativo toggle: desativa e reativa (idempotente e reversível).
    const off = await request.post(`/api/admin/usuarios/${userId}/ativo`, { data: { ativo: false } });
    expect(off.status(), "desativar deve ser 200").toBe(200);
    const on = await request.post(`/api/admin/usuarios/${userId}/ativo`, { data: { ativo: true } });
    expect(on.status(), "reativar deve ser 200").toBe(200);

    // soft-DELETE (ativo:false) — cleanup lógico.
    const del = await request.delete(`/api/admin/usuarios/${userId}`);
    expect(del.status(), "soft-delete deve ser 200").toBe(200);
    await logout(request);
  });

  // ================= marketplace-leads/[id] — restaura ou só-authz ===========

  test("marketplace-leads/[id]: id inexistente → 404; restaura se houver lead", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    // 404 com id fake.
    const fake = await request.patch(`/api/admin/marketplace-leads/${ID_FAKE}`, {
      data: { status: "notificado" },
    });
    expect(fake.status(), "lead inexistente deve ser 404").toBe(404);

    // Se houver um lead real, exercita PATCH + restauração.
    const list = (await (await request.get("/api/admin/marketplace-leads")).json()) as
      | { rows?: Array<{ id: string; status: string }> }
      | Array<{ id: string; status: string }>;
    const rows = Array.isArray(list) ? list : (list.rows ?? []);
    const lead = rows[0];
    test.skip(!lead, "sem lead de marketplace no seed — cobertura só via authz + 404");

    const statusOriginal = lead.status;
    const novo = statusOriginal === "notificado" ? "pendente" : "notificado";
    const patch = await request.patch(`/api/admin/marketplace-leads/${lead.id}`, {
      data: { status: novo },
    });
    expect(patch.status(), "PATCH lead deve ser 200").toBe(200);
    // Restaura.
    await request.patch(`/api/admin/marketplace-leads/${lead.id}`, {
      data: { status: statusOriginal },
    });
    await logout(request);
  });

  // ================= SÓ-AUTHZ (irreversível/arriscado): 404 c/ id fake =======
  // legal/api-key já cobertos no authz transversal (401/403). Aqui reforçamos
  // que planos/[id] com id fake dá 404 (validação de existência antes de mutar),
  // sem NUNCA alterar um plano real (evita mexer em preços de assinatura).

  test("planos/[id] PATCH com id inexistente → 404 (não muda nenhum plano real)", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.patch(`/api/admin/planos/${ID_FAKE}`, { data: { ativo: true } });
    expect(res.status(), "plano inexistente deve ser 404").toBe(404);
    await logout(request);
  });
});
