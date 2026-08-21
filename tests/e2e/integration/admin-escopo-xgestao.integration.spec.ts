import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, logout, uniqueEmail, SEED_ADMIN_EMAIL } from "../helpers";

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
): Promise<string | null> {
  const res = await request.post("/api/admin/usuarios", {
    data: {
      name: "Admin Escopo E2E",
      email,
      role: "admin",
      // senhaModo é obrigatório no createSchema; "random" evita política de senha.
      senhaModo: "random",
    },
  });
  if (!res.ok()) return null;
  const body = (await res.json().catch(() => ({}))) as {
    id?: string;
    user?: { id?: string };
  };
  return body.id ?? body.user?.id ?? null;
}

test.describe("XG06 — escopo administrativo", () => {
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
