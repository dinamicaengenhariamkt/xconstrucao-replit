import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Chat ordering & send/load verification (after keyset ordering fix).
 *
 * Context: The `seq` column was absent in the DB, causing 500 errors on every
 * chat send/load. The fix reverts to (criada_em, id) keyset ordering. These
 * tests confirm:
 *   - Empreiteiro can send a message → 200, message persisted
 *   - Messages are returned in ascending chronological order (oldest first)
 *   - Contratante sees the same messages from the other side of the thread
 *   - Pagination cursor (before=) loads older pages without duplicates or gaps
 *   - No "column seq does not exist" or 500 errors appear
 *
 * Prerequisites:
 *   - E2E_TEST_AUTH=1 enables /api/test/login-as (faster, no anti-bot).
 *     Falls back to real credential login when not available.
 *   - Seed accounts: joao@construtora.com (contratante), maria@empreiteira.com (empreiteiro)
 *   - A chat thread must exist between them (created via /api/empreiteiro/chat/garantir-thread
 *     or populated by previous seed/test runs).
 */

const CONTRATANTE_EMAIL = "joao@construtora.com";
const CONTRATANTE_PASS = "Joao@2026!Obras";
const EMPREITEIRO_EMAIL = "maria@empreiteira.com";
const EMPREITEIRO_PASS = "Maria@2026!Reforma";

/**
 * Login helper: tries /api/test/login-as (E2E_TEST_AUTH=1) first, falls back
 * to a real credential POST to /api/auth/login with the anti-bot payload.
 */
async function loginAs(
  request: APIRequestContext,
  email: string,
  password: string,
) {
  const fast = await request.post("/api/test/login-as", { data: { email } });
  if (fast.ok()) return;

  const res = await request.post("/api/auth/login", {
    data: {
      email,
      password,
      mountedAt: Date.now() - 3000,
      website: "",
    },
  });
  expect(res.ok(), `login real de ${email} deve responder ok (status ${res.status()})`).toBeTruthy();
}

async function logout(request: APIRequestContext) {
  await request.post("/api/auth/logout").catch(() => {});
}

/** Returns the first conversation ID from the empreiteiro conversations list. */
async function getFirstEmpreiteiroThread(request: APIRequestContext): Promise<string | null> {
  const res = await request.get("/api/empreiteiro/chat/conversations");
  if (!res.ok()) return null;
  const body = (await res.json()) as Array<{ id: string }>;
  return body[0]?.id ?? null;
}

/** Returns the first conversation ID from the contratante conversations list. */
async function getFirstContratanteThread(request: APIRequestContext): Promise<string | null> {
  const res = await request.get("/api/contratante/chat/conversations");
  if (!res.ok()) return null;
  const body = (await res.json()) as Array<{ id: string }>;
  return body[0]?.id ?? null;
}

test.describe("Chat — send/load e ordenação (keyset fix)", () => {
  test("empreiteiro envia mensagem → 200 e mensagem aparece na lista em ordem cronológica ASC", async ({
    request,
  }) => {
    await loginAs(request, EMPREITEIRO_EMAIL, EMPREITEIRO_PASS);

    const threadId = await getFirstEmpreiteiroThread(request);
    test.skip(!threadId, "Sem threads disponíveis para o empreiteiro — pular");

    const uniqueText = `e2e-ordering-${Date.now()}`;

    const beforeRes = await request.get(
      `/api/empreiteiro/chat/${threadId}/messages?limit=50`,
    );
    expect(beforeRes.ok(), "GET mensagens antes do envio deve responder OK (não 500)").toBeTruthy();
    const before = (await beforeRes.json()) as Array<{
      id: string;
      content: string;
      timestamp: string;
    }>;
    expect(Array.isArray(before), "resposta de mensagens deve ser array").toBeTruthy();
    const countBefore = before.length;

    const sendRes = await request.post(
      `/api/empreiteiro/chat/${threadId}/messages`,
      { data: { texto: uniqueText } },
    );
    expect(sendRes.status(), "POST mensagem deve retornar 200").toBe(200);
    const sendBody = (await sendRes.json()) as { ok: boolean; id?: string };
    expect(sendBody.ok, "POST deve responder ok=true").toBe(true);
    expect(typeof sendBody.id, "POST deve devolver id da nova mensagem").toBe("string");

    const afterRes = await request.get(
      `/api/empreiteiro/chat/${threadId}/messages?limit=50`,
    );
    expect(afterRes.ok(), "GET mensagens após envio deve responder OK").toBeTruthy();
    const after = (await afterRes.json()) as Array<{
      id: string;
      content: string;
      timestamp: string;
    }>;
    expect(Array.isArray(after), "resposta pós-envio deve ser array").toBeTruthy();
    expect(after.length, "total de mensagens deve ser countBefore + 1").toBe(countBefore + 1);

    const sent = after.find((m) => m.content === uniqueText);
    expect(sent, "mensagem enviada deve constar na lista").toBeTruthy();

    for (let i = 0; i < after.length - 1; i++) {
      const curr = after[i]!.timestamp;
      const next = after[i + 1]!.timestamp;
      expect(
        curr <= next,
        `ordem ASC esperada: msg[${i}].timestamp (${curr}) ≤ msg[${i + 1}].timestamp (${next})`,
      ).toBeTruthy();
    }

    await logout(request);
  });

  test("contratante vê as mesmas mensagens da thread em ordem cronológica ASC", async ({
    request,
  }) => {
    await loginAs(request, EMPREITEIRO_EMAIL, EMPREITEIRO_PASS);
    const empThreadId = await getFirstEmpreiteiroThread(request);
    test.skip(!empThreadId, "Sem threads para o empreiteiro — pular");

    const msgText = `e2e-cross-persona-${Date.now()}`;
    const sendRes = await request.post(
      `/api/empreiteiro/chat/${empThreadId}/messages`,
      { data: { texto: msgText } },
    );
    expect(sendRes.ok(), "empreiteiro deve conseguir enviar mensagem").toBeTruthy();
    await logout(request);

    await loginAs(request, CONTRATANTE_EMAIL, CONTRATANTE_PASS);
    const contThreadId = await getFirstContratanteThread(request);
    test.skip(!contThreadId, "Sem threads para o contratante — pular");

    const contRes = await request.get(
      `/api/contratante/chat/messages/${contThreadId}?limit=50`,
    );
    expect(contRes.ok(), "contratante: GET mensagens deve responder OK").toBeTruthy();
    const msgs = (await contRes.json()) as Array<{ content: string; timestamp: string }>;
    expect(Array.isArray(msgs), "resposta deve ser array").toBeTruthy();
    expect(msgs.length, "deve haver ao menos 1 mensagem").toBeGreaterThan(0);

    const found = msgs.find((m) => m.content === msgText);
    expect(found, "mensagem do empreiteiro deve aparecer para o contratante").toBeTruthy();

    for (let i = 0; i < msgs.length - 1; i++) {
      const curr = msgs[i]!.timestamp;
      const next = msgs[i + 1]!.timestamp;
      expect(
        curr <= next,
        `contratante: ordem ASC esperada: msg[${i}] (${curr}) ≤ msg[${i + 1}] (${next})`,
      ).toBeTruthy();
    }

    await logout(request);
  });

  test("paginação com cursor before=: página 2 sem duplicatas e contém mensagens mais antigas", async ({
    request,
  }) => {
    await loginAs(request, CONTRATANTE_EMAIL, CONTRATANTE_PASS);

    const threadId = await getFirstContratanteThread(request);
    test.skip(!threadId, "Sem threads para o contratante — pular");

    const page1Res = await request.get(
      `/api/contratante/chat/messages/${threadId}?limit=2`,
    );
    expect(page1Res.ok(), "página 1 deve responder OK").toBeTruthy();
    const page1 = (await page1Res.json()) as Array<{ id: string; timestamp: string }>;
    expect(Array.isArray(page1), "página 1 deve ser array").toBeTruthy();

    const cursor = page1Res.headers()["x-next-cursor"];
    test.skip(
      !cursor,
      "Sem header x-next-cursor → thread tem menos de 3 mensagens; paginação não aplicável",
    );

    const page1Ids = new Set(page1.map((m) => m.id));
    const oldestPage1Ts = page1[0]?.timestamp ?? "";

    const page2Res = await request.get(
      `/api/contratante/chat/messages/${threadId}?limit=2&before=${cursor}`,
    );
    expect(page2Res.ok(), "página 2 deve responder OK").toBeTruthy();
    const page2 = (await page2Res.json()) as Array<{ id: string; timestamp: string }>;
    expect(Array.isArray(page2), "página 2 deve ser array").toBeTruthy();
    expect(page2.length, "página 2 deve ter ao menos 1 mensagem").toBeGreaterThan(0);

    for (const msg of page2) {
      expect(
        page1Ids.has(msg.id),
        `id ${msg.id} da pág 2 não deve aparecer na pág 1 (sem duplicatas)`,
      ).toBe(false);
    }

    for (const msg of page2) {
      expect(
        msg.timestamp <= oldestPage1Ts,
        `pág 2 (${msg.timestamp}) deve ser ≤ mais antiga da pág 1 (${oldestPage1Ts})`,
      ).toBeTruthy();
    }

    await logout(request);
  });

  test("GET mensagens não retorna 500 nem erro de coluna seq", async ({ request }) => {
    await loginAs(request, EMPREITEIRO_EMAIL, EMPREITEIRO_PASS);

    const threadId = await getFirstEmpreiteiroThread(request);
    test.skip(!threadId, "Sem threads para o empreiteiro — pular");

    const res = await request.get(
      `/api/empreiteiro/chat/${threadId}/messages?limit=50`,
    );
    expect(
      res.status(),
      "GET mensagens deve retornar 200, não 500 (nenhuma referência a coluna seq)",
    ).toBe(200);

    const body = (await res.json()) as unknown;
    const bodyStr = JSON.stringify(body);
    expect(
      bodyStr.toLowerCase().includes('"seq"') || bodyStr.includes("does not exist"),
      "resposta não deve conter referência a coluna seq ou erro de coluna ausente",
    ).toBe(false);
    expect(Array.isArray(body), "resposta deve ser array de mensagens").toBeTruthy();

    await logout(request);
  });
});
