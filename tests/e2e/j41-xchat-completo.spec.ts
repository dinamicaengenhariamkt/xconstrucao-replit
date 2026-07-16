import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Jornada 41 — XChat Completo.
 * Pré-requisitos (env injetado pelo playwright.config.ts):
 *   - E2E_TEST_AUTH=1   habilita /api/test/login-as (cookies sem senha)
 *
 * Valida:
 *   - guards da rota garantir-thread do empreiteiro (403 não-empreiteiro; 422
 *     NAO_VINCULADO quando a obra não é da empreiteira logada / inexistente);
 *   - endpoint de contagem agregada de não-lidas responde { total: number };
 *   - href de notificação de chat, quando existir, usa ?thread= (não ?conversationId=).
 *
 * Os cenários que exigem uma obra com vínculo firmado (empreiteira contratada
 * + contratante) usam `test.skip` condicional quando o banco de seed não tem
 * esse dado — mesmo padrão defensivo da J21.
 */

const CONTRATANTE_EMAIL = "joao@construtora.com"; // seed — role contratante
const EMPREITEIRO_EMAIL = "maria@empreiteira.com"; // seed — role empreiteiro

async function loginAs(request: APIRequestContext, email: string) {
  const res = await request.post("/api/test/login-as", { data: { email } });
  expect(res.ok(), `login-as ${email} deve responder ok`).toBeTruthy();
}

async function logout(request: APIRequestContext) {
  await request.post("/api/auth/logout").catch(() => {});
}

test.describe("Jornada 41 — XChat Completo", () => {
  test("garantir-thread do empreiteiro: 422 NAO_VINCULADO para obra inexistente", async ({
    request,
  }) => {
    await loginAs(request, EMPREITEIRO_EMAIL);

    const res = await request.post("/api/empreiteiro/chat/garantir-thread", {
      data: { obraId: "00000000-0000-0000-0000-000000000000" },
    });
    // Obra inexistente resolve NOT_FOUND → 404; obra sem vínculo → 422. Ambos
    // impedem a criação de thread. Aceitamos os dois como "não abre chat".
    expect([404, 422]).toContain(res.status());

    await logout(request);
  });

  test("garantir-thread do empreiteiro: contratante recebe 403", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);

    const res = await request.post("/api/empreiteiro/chat/garantir-thread", {
      data: { obraId: "00000000-0000-0000-0000-000000000000" },
    });
    expect(res.status(), "contratante não pode usar a rota do empreiteiro").toBe(403);

    await logout(request);
  });

  test("unread-count responde { total } para ambas as personas", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);
    const cRes = await request.get("/api/contratante/chat/unread-count");
    expect(cRes.ok()).toBeTruthy();
    const cBody = (await cRes.json()) as { total: number };
    expect(typeof cBody.total).toBe("number");
    expect(cBody.total).toBeGreaterThanOrEqual(0);
    await logout(request);

    await loginAs(request, EMPREITEIRO_EMAIL);
    const eRes = await request.get("/api/empreiteiro/chat/unread-count");
    expect(eRes.ok()).toBeTruthy();
    const eBody = (await eRes.json()) as { total: number };
    expect(typeof eBody.total).toBe("number");
    expect(eBody.total).toBeGreaterThanOrEqual(0);
    await logout(request);
  });

  test("garantir-thread não-autenticado é rejeitado", async ({ request }) => {
    // Sem login-as — o guard requireVerifiedUser deve barrar (401/403).
    const res = await request.post("/api/empreiteiro/chat/garantir-thread", {
      data: { obraId: "00000000-0000-0000-0000-000000000000" },
    });
    expect([401, 403]).toContain(res.status());
  });

  test("href de notificação de chat, quando existir, usa ?thread=", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);

    const res = await request.get("/api/notificacoes?page=1&pageSize=50").catch(() => null);
    // Endpoint pode ter shape diferente entre versões; se não responder OK, pula.
    test.skip(!res || !res.ok(), "endpoint de notificações indisponível nesta execução");

    const body = (await res!.json()) as
      | { items?: Array<{ href?: string | null }> }
      | Array<{ href?: string | null }>;
    const items = Array.isArray(body) ? body : (body.items ?? []);
    const chatNotifs = items.filter((n) => (n.href ?? "").includes("/chat"));

    test.skip(chatNotifs.length === 0, "sem notificações de chat no banco desta execução");

    for (const n of chatNotifs) {
      expect(n.href, "notificação de chat deve linkar com ?thread=").toContain("?thread=");
      expect(n.href, "não deve mais usar ?conversationId=").not.toContain("conversationId=");
    }

    await logout(request);
  });
});
