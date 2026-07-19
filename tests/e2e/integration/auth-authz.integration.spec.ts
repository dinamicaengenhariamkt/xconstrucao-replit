import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, logout } from "../helpers";

/**
 * Integração (J36) — Auth & Autorização (guards transversais).
 *
 * `requireVerifiedUser` (features/auth/api/auth-utils.ts) é a porta de entrada
 * de ~200 rotas autenticadas; `requireAdmin` (features/admin/shared/api/
 * admin-guard.ts) protege as rotas admin. Um bug em qualquer um afeta o sistema
 * inteiro — daí a prioridade destes testes.
 *
 * Cobre:
 *   - T2.1 EMAIL_NOT_VERIFIED: usuário logado mas com email não verificado é
 *          barrado (403) numa rota autenticada. Usa uma conta de seed NOVER.
 *   - T2.2 Admin-only: contratante e empreiteiro recebem 403 em rota /api/admin;
 *          não-autenticado recebe 401.
 *   - T2.3 IDOR entre personas: contratante não usa rota de empreiteiro (403).
 *   - T2.5 Login: payload inválido → 400 (não 500); credencial errada → 401 com
 *          mensagem genérica (não vaza existência de conta).
 *
 * (T2.4 Impersonation read-only exige montar o cookie de impersonation, que só
 * o fluxo de superadmin emite; fica documentado na J36 como gap a cobrir quando
 * houver um endpoint test-only para simular impersonation. Ver §10.)
 *
 * Pré-requisitos (injetados pelo playwright.config.ts):
 *   - E2E_TEST_AUTH=1  habilita /api/test/login-as
 *   - Seed com contas de papéis distintos e ao menos uma NOVER (email não verificado).
 */

const CONTRATANTE_EMAIL = "joao@construtora.com";
const EMPREITEIRO_EMAIL = "maria@empreiteira.com";
const ADMIN_EMAIL = "admin@xconstrucao.com";
// Conta de seed com email NÃO verificado (login-as não neutraliza esse gate).
const NOVER_EMAIL = "teste-1778553138682@xconstrucao.com";


/** Confirma que a conta NOVER existe no seed; senão pula os testes que a exigem. */
async function noverExiste(request: APIRequestContext): Promise<boolean> {
  const res = await request.post("/api/test/login-as", { data: { email: NOVER_EMAIL } });
  await logout(request);
  return res.ok();
}

test.describe("Integração — Auth & Autorização", () => {
  // ---- T2.1: EMAIL_NOT_VERIFIED -------------------------------------------

  test("usuário com email NÃO verificado é barrado (403 EMAIL_NOT_VERIFIED) em rota autenticada", async ({
    request,
  }) => {
    test.skip(!(await noverExiste(request)), "Sem conta NOVER no seed desta execução — pular");

    await loginAs(request, NOVER_EMAIL);
    // /api/contratante/medicoes usa requireVerifiedUser antes do role-gate, então
    // o gate de email dispara primeiro. (A conta NOVER é contratante, então não é
    // o role que barra — é a verificação de email.)
    const res = await request.get("/api/contratante/medicoes");
    expect(res.status(), "email não verificado deve ser barrado com 403").toBe(403);
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    expect(body.error, "erro deve ser EMAIL_NOT_VERIFIED").toBe("EMAIL_NOT_VERIFIED");

    await logout(request);
  });

  // ---- T2.2: Admin-only barra não-admin -----------------------------------

  test("rota /api/admin barra não-admin: contratante → 403, empreiteiro → 403", async ({
    request,
  }) => {
    await loginAs(request, CONTRATANTE_EMAIL);
    const cRes = await request.get("/api/admin/clientes");
    expect(cRes.status(), "contratante não pode acessar /api/admin/clientes").toBe(403);
    await logout(request);

    await loginAs(request, EMPREITEIRO_EMAIL);
    const eRes = await request.get("/api/admin/clientes");
    expect(eRes.status(), "empreiteiro não pode acessar /api/admin/clientes").toBe(403);
    await logout(request);
  });

  test("rota /api/admin sem autenticação → 401", async ({ request }) => {
    // Sem login-as: nenhum cookie de sessão.
    const res = await request.get("/api/admin/clientes");
    expect(res.status(), "não-autenticado em rota admin deve ser 401").toBe(401);
  });

  test("admin acessa /api/admin/clientes (200) — guard não é falso-positivo", async ({
    request,
  }) => {
    await loginAs(request, ADMIN_EMAIL);
    const res = await request.get("/api/admin/clientes");
    expect(res.ok(), "admin deve conseguir listar clientes (200)").toBeTruthy();
    await logout(request);
  });

  // ---- T2.3: IDOR entre personas ------------------------------------------

  test("contratante não usa rota de empreiteiro (garantir-thread → 403)", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);
    const res = await request.post("/api/empreiteiro/chat/garantir-thread", {
      data: { obraId: "00000000-0000-0000-0000-000000000000" },
    });
    expect(res.status(), "contratante na rota do empreiteiro deve receber 403").toBe(403);
    await logout(request);
  });

  test("empreiteiro não acessa rota role-gated de contratante (medicoes → 403)", async ({
    request,
  }) => {
    await loginAs(request, EMPREITEIRO_EMAIL);
    // /api/contratante/medicoes barra role !== "contratante" (admin passa; empreiteiro não).
    const res = await request.get("/api/contratante/medicoes");
    expect(
      [401, 403].includes(res.status()),
      `empreiteiro em rota de contratante deve receber 401/403 (recebeu ${res.status()})`,
    ).toBeTruthy();
    await logout(request);
  });

  // ---- T2.5: Login — validação e não-vazamento ----------------------------

  test("login com payload inválido → 400 (não 500)", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: { email: "não-é-email", password: "" },
    });
    expect(res.status(), "payload inválido deve retornar 400, não 500").toBe(400);
    await logout(request);
  });

  test("login com credencial errada → 401 e mensagem genérica (não vaza existência)", async ({
    request,
  }) => {
    const res = await request.post("/api/auth/login", {
      data: {
        email: CONTRATANTE_EMAIL,
        password: "senha-totalmente-errada-E2E",
        mountedAt: Date.now() - 3000,
        website: "",
      },
    });
    expect(res.status(), "senha errada deve retornar 401").toBe(401);
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    // Mensagem genérica: não deve diferenciar "email não existe" de "senha errada".
    expect(
      (body.error ?? "").toLowerCase(),
      "mensagem deve ser genérica (Email ou senha inválidos)",
    ).toContain("inválid");
    await logout(request);
  });

  test("login de email inexistente → 401 com a MESMA mensagem genérica", async ({ request }) => {
    const res = await request.post("/api/auth/login", {
      data: {
        email: "ninguem-existe-E2E@xconstrucao.test",
        password: "qualquer-coisa",
        mountedAt: Date.now() - 3000,
        website: "",
      },
    });
    expect(res.status(), "email inexistente também deve retornar 401").toBe(401);
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    expect(
      (body.error ?? "").toLowerCase(),
      "mensagem deve ser a mesma genérica (não confirmar/negar existência)",
    ).toContain("inválid");
    await logout(request);
  });
});
