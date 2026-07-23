import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { uniqueEmail, uniqueUsername, loginAs, logout, SEED_ADMIN_EMAIL, SEED_CONTRATANTE_EMAIL } from "../helpers";

/**
 * Integração (J60) — Área de Contratos no admin (registro de aceites).
 *
 * Fonte de dados: `user_consents` (aceite do Termo do Anunciante da J59). Cobre:
 *   1. AUTHZ: anônimo → 401; não-admin (contratante) → 403; admin → 200 em
 *      /api/admin/contratos e /kpi.
 *   2. Seed real: registra anunciante E2E, aceita o termo → aparece na listagem
 *      admin (nome/email/documento/versão).
 *   3. KPI: termo_anunciante com versão vigente e contagem ≥ 1 após o aceite.
 *   4. Filtro: ?q=<email> restringe ao usuário.
 *
 * Sem mock — tudo via endpoints reais + estado no banco. Pré-req: E2E_TEST_AUTH=1.
 */

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };

/** Registra um anunciante E2E, verifica o email e devolve { userId, email, nome }. */
async function registrarEAceitar(request: APIRequestContext, tag: string) {
  const email = uniqueEmail(`j60-${tag}`);
  const nome = `E2E Anunciante J60 ${tag}`;
  const reg = await request.post("/api/auth/register", {
    data: {
      name: nome,
      email,
      username: uniqueUsername(`j60${tag}`),
      password: "Xconstr@E2E2026!",
      role: "anunciante",
      phone: "11955550000",
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  // 429 = rate-limit de registro (5/h/IP) compartilhado com outros specs.
  test.skip(reg.status() === 429, "Rate-limit de registro esgotado nesta execução — pular");
  expect([200, 201].includes(reg.status()), `registro recebeu ${reg.status()}`).toBeTruthy();

  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  expect(row?.id, "usuário deve existir").toBeTruthy();
  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, row.id));

  await loginAs(request, email);
  const aceite = await request.post("/api/anunciante/contrato", { data: {} });
  expect(aceite.ok(), `aceite deve responder ok (status ${aceite.status()})`).toBeTruthy();
  await logout(request);

  return { userId: row.id, email, nome };
}

test.describe.serial("Integração — J60: Contratos no admin", () => {
  // ---- AUTHZ ---------------------------------------------------------------

  test("AUTHZ: anônimo → 401; contratante → 403; admin → 200", async ({ request }) => {
    await logout(request);
    for (const path of ["/api/admin/contratos", "/api/admin/contratos/kpi"]) {
      expect((await request.get(path)).status(), `${path} anônimo`).toBe(401);
    }

    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    for (const path of ["/api/admin/contratos", "/api/admin/contratos/kpi"]) {
      expect((await request.get(path)).status(), `${path} contratante`).toBe(403);
    }
    await logout(request);

    await loginAs(request, SEED_ADMIN_EMAIL);
    for (const path of ["/api/admin/contratos", "/api/admin/contratos/kpi"]) {
      expect((await request.get(path)).status(), `${path} admin`).toBe(200);
    }
    await logout(request);
  });

  // ---- Seed + listagem + KPI + filtro --------------------------------------

  test("aceite do anunciante aparece na listagem admin, no KPI e é filtrável por email", async ({ request }) => {
    const { email, nome } = await registrarEAceitar(request, "lista");

    await loginAs(request, SEED_ADMIN_EMAIL);

    // Listagem contém o aceite recém-criado.
    const listRes = await request.get("/api/admin/contratos?documento=termo_anunciante");
    expect(listRes.ok()).toBeTruthy();
    const linhas = (await listRes.json()) as Array<Record<string, any>>;
    const alvo = linhas.find((l) => l.email === email);
    expect(alvo, "aceite do anunciante deve aparecer na listagem").toBeTruthy();
    expect(alvo?.documento).toBe("termo_anunciante");
    expect(alvo?.usuario).toBe(nome);
    expect(Number(alvo?.versao) >= 1, "versão aceita ≥ 1").toBeTruthy();

    // KPI reflete o tipo com versão vigente + contagem ≥ 1.
    const kpiRes = await request.get("/api/admin/contratos/kpi");
    expect(kpiRes.ok()).toBeTruthy();
    const kpis = (await kpiRes.json()) as Array<Record<string, any>>;
    const kAnun = kpis.find((k) => k.documento === "termo_anunciante");
    expect(kAnun, "KPI do termo do anunciante deve existir").toBeTruthy();
    expect(kAnun?.versaoVigente, "versão vigente deve vir").toBeGreaterThanOrEqual(1);
    expect(kAnun?.totalAceites, "total de aceites ≥ 1").toBeGreaterThanOrEqual(1);

    // Filtro por email restringe ao usuário.
    const qRes = await request.get(`/api/admin/contratos?q=${encodeURIComponent(email)}`);
    const qLinhas = (await qRes.json()) as Array<Record<string, any>>;
    expect(qLinhas.length >= 1, "busca deve achar o aceite").toBeTruthy();
    expect(qLinhas.every((l) => l.email === email), "busca deve restringir ao email").toBeTruthy();

    await logout(request);
  });
});
