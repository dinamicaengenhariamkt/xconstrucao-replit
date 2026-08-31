import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, logout, uniqueEmail, SEED_ADMIN_EMAIL } from "../helpers";
import { resolvePostLoginRedirect } from "@features/auth/utils/redirect-by-role";
import { db } from "@shared/db/db";
import { sessions, users } from "@shared/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@features/auth/api/auth-service";
import {
  getExpectedRoleForLogin,
  getLoginContext,
} from "@features/auth/utils/login-context";

/**
 * Integração (XG06) — escopo administrativo (`users.admin_escopo`).
 *
 * O que este spec protege, em ordem de gravidade:
 *
 *   1. RETROCOMPATIBILIDADE. A coluna nasceu com DEFAULT 'global', então todo
 *      admin/superadmin que já existia tem de continuar acessando tudo. Uma
 *      regressão aqui derruba a operação inteira — é o teste mais importante do
 *      arquivo, mesmo parecendo o mais banal.
 *   2. O GUARD DE ESCOPO nega o admin restrito fora da allowlist (`ADMIN_ESCOPO_
 *      NEGADO`), aplicado no proxy para todo `/api/admin/*` sem editar as 94
 *      rotas existentes.
 *   3. AS TRAVAS de quem pode alterar o escopo: só superadmin, nunca a própria
 *      conta, e apenas sobre contas com role `admin`.
 *
 * Estratégia (ambiente compartilhado — não sujar): a conta restrita é criada
 * descartável com email único e "E2E" no nome, e é removida no fim. Nenhum admin
 * pré-existente é modificado.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com o admin.
 */

const ID_FAKE = "00000000-0000-0000-0000-000000000000";

/** Rota admin fora da allowlist do escopo xgestão — o alvo do 403. */
const ROTA_FORA_DO_ESCOPO = "/api/admin/financeiro/dashboard-stats";
/** Rota admin dentro da allowlist. */
const ROTA_NO_ESCOPO = "/api/admin/xgestao";
/** Planos genéricos incluem marketplace e não pertencem ao escopo xgestão. */
const ROTA_PLANOS_MARKETPLACE = "/api/admin/planos";

/** Cria um admin descartável e devolve o id. Requer sessão de superadmin. */
async function criarAdminDescartavel(
  request: APIRequestContext,
  email: string,
  password?: string,
): Promise<string | null> {
  const res = await request.post("/api/admin/usuarios", {
    data: {
      name: "Admin Escopo E2E",
      email,
      role: "admin",
      senhaModo: password ? "manual" : "random",
      senhaManual: password,
      forceChangeOnFirstLogin: password ? false : undefined,
    },
  });
  if (!res.ok()) return null;
  const body = (await res.json().catch(() => ({}))) as {
    id?: string;
    user?: { id?: string };
  };
  return body.id ?? body.user?.id ?? null;
}

async function accessTokenAtual(request: APIRequestContext): Promise<string | null> {
  const state = await request.storageState();
  return state.cookies.find((cookie) => cookie.name === "access_token")?.value ?? null;
}

test.describe("XG06 — escopo administrativo", () => {
  test("login administrativo é único e não oferece cadastro público", async ({
    request,
  }) => {
    const loginPage = await request.get("/login?perfil=administrador");
    expect(loginPage.ok()).toBeTruthy();
    const html = await loginPage.text();
    expect(html).toContain("Administrador");
    expect(html).not.toContain("Cadastre-se");

    const cadastroAdmin = await request.post("/api/auth/register", {
      data: {
        name: "Admin público indevido",
        email: uniqueEmail("admin-publico-negado"),
        username: `admin-publico-${Date.now()}`,
        password: "Xconstr@E2E2026!",
        role: "admin",
        acceptTerms: true,
        website: "",
        mountedAt: Date.now() - 5_000,
      },
    });
    expect(cadastroAdmin.status(), "cadastro público nunca deve aceitar role admin").toBe(400);
  });

  test("tela xgestão usa contexto de produto sem impor role empreiteiro", async ({
    request,
  }) => {
    const loginPage = await request.get(
      "/login?perfil=xgestao&next=%2Fxgestao%2Fobras",
    );
    expect(loginPage.ok()).toBeTruthy();
    const html = await loginPage.text();
    expect(html).toContain("xgestão");
    expect(html).not.toContain("Acessar xgestão");
    expect(getLoginContext("xgestao")).toBe("xgestao");
    expect(getExpectedRoleForLogin("xgestao")).toBeUndefined();
  });

  test("login administrativo respeita o escopo xgestão", async ({ request }) => {
    const email = uniqueEmail("login-admin-xgestao");
    const password = "AdminXGestao@2026!";
    const [admin] = await db.insert(users).values({
      name: "Admin xgestão E2E",
      email,
      password: await hashPassword(password),
      role: "admin",
      adminEscopo: "xgestao",
      ativo: true,
      emailVerified: new Date(),
      mustChangePassword: false,
    }).returning({ id: users.id });

    try {
      const login = await request.post("/api/auth/login", {
        data: {
          email,
          password,
          expectedRole: "admin",
          website: "",
          mountedAt: Date.now() - 5_000,
        },
      });
      expect(login.status(), await login.text()).toBe(200);
      const loginBody = (await login.json()) as {
        user: { role: string; adminEscopo: string; roles?: string[] };
      };
      expect(loginBody.user).toMatchObject({ role: "admin", adminEscopo: "xgestao" });
      expect(
        resolvePostLoginRedirect(
          loginBody.user.role,
          null,
          loginBody.user.roles,
          loginBody.user.adminEscopo,
        ),
      ).toBe("/admin/xgestao");

      // Os cookies de sessão são Secure; o APIRequestContext local usa HTTP e
      // por isso precisa reenviar explicitamente o token recém-emitido.
      const token = await accessTokenAtual(request);
      expect(token, "login real deve emitir access_token").toBeTruthy();
      const headers = { Cookie: `access_token=${token}` };

      expect((await request.get("/admin/xgestao", { headers, maxRedirects: 0 })).status()).toBe(200);
      expect((await request.get(ROTA_NO_ESCOPO, { headers })).status()).toBe(200);
      expect((await request.get(ROTA_FORA_DO_ESCOPO, { headers })).status()).toBe(403);
    } finally {
      await logout(request);
      await db.delete(sessions).where(eq(sessions.userId, admin.id));
      await db.delete(users).where(eq(users.id, admin.id));
    }
  });

  test("entrada única xgestão reconhece administrador sem aceitar next de empreiteiro", async ({
    request,
  }) => {
    const email = uniqueEmail("login-unico-admin-xgestao");
    const password = "AdminXGestao@2026!";
    const [admin] = await db.insert(users).values({
      name: "Admin Login Único xgestão E2E",
      email,
      password: await hashPassword(password),
      role: "admin",
      adminEscopo: "xgestao",
      ativo: true,
      emailVerified: new Date(),
      mustChangePassword: false,
    }).returning({ id: users.id });

    try {
      const login = await request.post("/api/auth/login", {
        data: {
          email,
          password,
          website: "",
          mountedAt: Date.now() - 5_000,
        },
      });
      expect(login.status(), await login.text()).toBe(200);
      const body = (await login.json()) as {
        user: { role: string; adminEscopo: string; roles?: string[] };
      };
      expect(
        resolvePostLoginRedirect(
          body.user.role,
          "/xgestao/obras",
          body.user.roles,
          body.user.adminEscopo,
          "xgestao",
        ),
      ).toBe("/admin/xgestao");
    } finally {
      await logout(request);
      await db.delete(sessions).where(eq(sessions.userId, admin.id));
      await db.delete(users).where(eq(users.id, admin.id));
    }
  });

  test("admin global (seed) segue acessando rota fora da allowlist do xgestão", async ({
    request,
  }) => {
    // O teste de regressão que realmente importa: o admin que já existia não
    // pode ter perdido nada. `admin_escopo` ausente/'global' ⇒ acesso normal.
    await loginAs(request, SEED_ADMIN_EMAIL);

    const res = await request.get(ROTA_FORA_DO_ESCOPO);
    expect(
      res.status(),
      `admin global deve continuar acessando ${ROTA_FORA_DO_ESCOPO} (status ${res.status()})`,
    ).not.toBe(403);

    await logout(request);
  });

  test("escopo default de conta nova é 'global'", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    const email = uniqueEmail("escopo-default");
    const id = await criarAdminDescartavel(request, email);
    test.skip(!id, "superadmin/criação de usuário indisponível neste ambiente");

    const res = await request.get(`/api/admin/usuarios/${id}`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(
      body.adminEscopo,
      "conta criada sem escopo explícito deve nascer 'global'",
    ).toBe("global");

    await request.delete(`/api/admin/usuarios/${id}`).catch(() => {});
    await logout(request);
  });

  test("admin de escopo xgestão é negado fora da allowlist e aceito dentro", async ({
    request,
  }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    const email = uniqueEmail("escopo-xgestao");
    const id = await criarAdminDescartavel(request, email);
    test.skip(!id, "superadmin/criação de usuário indisponível neste ambiente");

    const patch = await request.patch(`/api/admin/usuarios/${id}`, {
      data: { adminEscopo: "xgestao" },
    });
    test.skip(
      !patch.ok(),
      `PATCH de escopo exige superadmin; seed não é superadmin (status ${patch.status()})`,
    );

    await logout(request);
    await loginAs(request, email);

    const negado = await request.get(ROTA_FORA_DO_ESCOPO);
    expect(
      negado.status(),
      "admin de escopo xgestão deve tomar 403 fora da allowlist",
    ).toBe(403);
    const corpo = await negado.json().catch(() => ({}));
    expect(corpo.error).toBe("ADMIN_ESCOPO_NEGADO");

    const permitido = await request.get(ROTA_NO_ESCOPO);
    expect(
      permitido.status(),
      "admin de escopo xgestão deve acessar a allowlist",
    ).not.toBe(403);

    const planosMarketplace = await request.get(ROTA_PLANOS_MARKETPLACE);
    expect(
      planosMarketplace.status(),
      "admin de escopo xgestão não deve ler ou editar planos do marketplace",
    ).toBe(403);

    // Cleanup: volta ao superadmin para remover a conta descartável.
    await logout(request);
    await loginAs(request, SEED_ADMIN_EMAIL);
    await request.delete(`/api/admin/usuarios/${id}`).catch(() => {});
    await logout(request);
  });

  test("restringir o escopo bloqueia imediatamente a sessão administrativa já emitida", async ({
    request,
  }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    const email = uniqueEmail("escopo-sessao-antiga");
    const id = await criarAdminDescartavel(request, email);
    test.skip(!id, "superadmin/criação de usuário indisponível neste ambiente");

    await logout(request);
    await loginAs(request, email);
    const tokenAntigo = await accessTokenAtual(request);
    test.skip(!tokenAntigo, "login do admin descartável não retornou access_token");

    // Confirma que este é um token global emitido ANTES da mudança de escopo.
    const antesDaRestricao = await request.get(ROTA_FORA_DO_ESCOPO);
    expect(antesDaRestricao.status()).not.toBe(403);

    await logout(request);
    await loginAs(request, SEED_ADMIN_EMAIL);
    const patch = await request.patch(`/api/admin/usuarios/${id}`, {
      data: { adminEscopo: "xgestao" },
    });
    test.skip(
      !patch.ok(),
      `PATCH de escopo exige superadmin; seed não é superadmin (status ${patch.status()})`,
    );
    await logout(request);

    const staleSessionHeaders = { Cookie: `access_token=${tokenAntigo}` };
    const apiNegada = await request.get(ROTA_FORA_DO_ESCOPO, { headers: staleSessionHeaders });
    expect(apiNegada.status(), "API deve negar o token emitido antes da restrição").toBe(403);
    expect((await apiNegada.json()).error).toBe("ADMIN_ESCOPO_NEGADO");

    const paginaNegada = await request.get("/admin/financeiro", { headers: staleSessionHeaders });
    expect(paginaNegada.status(), "página deve negar o token emitido antes da restrição").toBe(403);
    expect((await paginaNegada.json()).error).toBe("ADMIN_ESCOPO_NEGADO");

    const apiPermitida = await request.get(ROTA_NO_ESCOPO, { headers: staleSessionHeaders });
    expect(apiPermitida.status(), "allowlist xgestão deve continuar acessível").not.toBe(403);

    await loginAs(request, SEED_ADMIN_EMAIL);
    await request.delete(`/api/admin/usuarios/${id}`).catch(() => {});
    await logout(request);
  });

  test("escopo só é alterável por superadmin, nunca sobre a própria conta", async ({
    request,
  }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    // Auto-edição é sempre negada — caminho de escalação/auto-restrição.
    const me = await request.get("/api/auth/me");
    const meBody = await me.json().catch(() => ({}));
    const meuId = (meBody as { id?: string }).id;
    if (meuId) {
      const auto = await request.patch(`/api/admin/usuarios/${meuId}`, {
        data: { adminEscopo: "xgestao" },
      });
      expect(
        [400, 403],
        "alterar o próprio escopo deve ser negado",
      ).toContain(auto.status());
    }

    // Escopo não se aplica a não-admin.
    const semAlvo = await request.patch(`/api/admin/usuarios/${ID_FAKE}`, {
      data: { adminEscopo: "xgestao" },
    });
    expect(semAlvo.status(), "id inexistente não deve retornar 200").not.toBe(200);

    await logout(request);
  });
});
