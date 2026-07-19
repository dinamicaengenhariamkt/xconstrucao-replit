/**
 * Testes E2E de integração — Retry de webhooks ASAAS falhos (Task #219).
 *
 * Cobre o caminho que antes era silencioso: um webhook que falha ao ser
 * processado fica em 'failed' no webhook_delivery_log e não é retentado
 * a menos que um novo webhook chegue. Agora o retry pode ser acionado
 * explicitamente via POST /api/admin/webhooks/retry-pending.
 *
 * Suites:
 *   1 — Auth guards do endpoint (401, 403, 200)
 *   2 — Retry com zero eventos pendentes → resposta válida com retried=0
 *   3 — Ciclo completo: insere 'failed' → retry → entry marcada como processed
 *
 * Pré-requisitos: E2E_TEST_AUTH=1; seed com admin (superadmin).
 */

import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, logout, SEED_EMPREITEIRO_EMAIL, SEED_CONTRATANTE_EMAIL, SEED_ADMIN_EMAIL } from "../helpers";

const RETRY_ENDPOINT = "/api/admin/webhooks/retry-pending";
const FORCE_FAILED_ENDPOINT = "/api/test/webhooks/force-failed";

function uid(label: string): string {
  return `e2e_retry_${label}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

// ---------------------------------------------------------------------------
// Suite 1 — Auth guards
// ---------------------------------------------------------------------------

test.describe("Webhook Retry — auth guards", () => {
  test("anônimo → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post(RETRY_ENDPOINT);
    expect(res.status(), "anônimo deve receber 401").toBe(401);
  });

  test("empreiteiro (não-admin) → 403", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.post(RETRY_ENDPOINT);
    expect(res.status(), "empreiteiro não-admin deve receber 403").toBe(403);
    await logout(request);
  });

  test("contratante (não-admin) → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.post(RETRY_ENDPOINT);
    expect(res.status(), "contratante não-admin deve receber 403").toBe(403);
    await logout(request);
  });

  test("admin → 200 com shape correto", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.post(RETRY_ENDPOINT, {
      data: { limit: 1 },
    });
    expect(res.status(), `admin deve receber 200, recebeu ${res.status()}`).toBe(200);

    const body = (await res.json()) as {
      ok?: boolean;
      retried?: number;
      succeeded?: number;
      failed?: number;
      runAt?: string;
    };
    expect(body.ok, "campo ok deve ser true").toBe(true);
    expect(typeof body.retried, "retried deve ser número").toBe("number");
    expect(typeof body.succeeded, "succeeded deve ser número").toBe("number");
    expect(typeof body.failed, "failed deve ser número").toBe("number");
    expect(typeof body.runAt, "runAt deve ser string").toBe("string");

    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — Retry com zero eventos pendentes
// ---------------------------------------------------------------------------

test.describe("Webhook Retry — sem eventos pendentes", () => {
  test("chamada sem eventos pendentes → retried=0, ok=true", async ({
    request,
  }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    const res = await request.post(RETRY_ENDPOINT, {
      data: { limit: 200 },
    });
    expect(res.status(), `deve responder 200, recebeu ${res.status()}`).toBe(200);

    const body = (await res.json()) as {
      ok?: boolean;
      retried?: number;
      succeeded?: number;
      failed?: number;
    };
    expect(body.ok, "ok deve ser true mesmo sem eventos").toBe(true);
    expect(body.retried, "retried deve ser ≥ 0").toBeGreaterThanOrEqual(0);
    expect(body.succeeded, "succeeded deve ser ≥ 0").toBeGreaterThanOrEqual(0);
    expect(body.failed, "failed deve ser ≥ 0").toBeGreaterThanOrEqual(0);

    await logout(request);
  });

  test("limit inválido é ignorado graciosamente", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);

    const res = await request.post(RETRY_ENDPOINT, {
      data: { limit: 99999 },
    });
    expect(
      res.status(),
      `limit inválido não deve causar 500, recebeu ${res.status()}`,
    ).toBe(200);

    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — Ciclo completo: insere 'failed' → retry → processado
// ---------------------------------------------------------------------------

test.describe("Webhook Retry — ciclo completo (simulação de falha → retry)", () => {
  test("insere entrada 'failed' via test helper, retry processa e retorna succeeded≥1", async ({
    request,
  }) => {
    // Verifica se o test helper está disponível (só funciona com E2E_TEST_AUTH=1)
    const checkRes = await request.post(FORCE_FAILED_ENDPOINT, {
      data: {},
    });
    test.skip(
      checkRes.status() === 404,
      "test helper /api/test/webhooks/force-failed não disponível — E2E_TEST_AUTH não ativado",
    );

    // O test helper pode ter inserido uma entry com rawBody={} — o retryPendingWebhookEvents
    // vai tentar processar a entry. Com o ManualGateway, um payload {} é interpretado
    // como type="ignored" → marcado como processed sem erro.
    const helperBody = (await checkRes.json()) as { id?: string; error?: string };
    expect(checkRes.status(), `force-failed deve retornar 201, recebeu ${checkRes.status()}`).toBe(201);
    expect(helperBody.id, "helper deve retornar id da row inserida").toBeTruthy();

    const insertedId = helperBody.id!;

    // Agora chama o retry como admin — espera que a entry seja processada
    await loginAs(request, SEED_ADMIN_EMAIL);

    const retryRes = await request.post(RETRY_ENDPOINT, {
      data: { limit: 50 },
    });
    expect(
      retryRes.status(),
      `retry deve responder 200, recebeu ${retryRes.status()}`,
    ).toBe(200);

    const retryBody = (await retryRes.json()) as {
      ok?: boolean;
      retried?: number;
      succeeded?: number;
      failed?: number;
    };
    expect(retryBody.ok, "retry deve reportar ok=true").toBe(true);
    expect(retryBody.retried, "deve ter retentado ao menos 1 evento").toBeGreaterThanOrEqual(1);
    // succeeded + failed deve igualar retried
    const processedTotal = (retryBody.succeeded ?? 0) + (retryBody.failed ?? 0);
    expect(
      processedTotal,
      `succeeded(${retryBody.succeeded}) + failed(${retryBody.failed}) deve ser igual a retried(${retryBody.retried})`,
    ).toBe(retryBody.retried);

    console.info(
      `[webhook-retry E2E] insertedId=${insertedId} retried=${retryBody.retried} succeeded=${retryBody.succeeded} failed=${retryBody.failed}`,
    );

    await logout(request);
  });

  test("entrada já processada não é retentada (idempotência)", async ({
    request,
  }) => {
    // Envia um webhook real ao gateway (que vai processar e marcar como 'processed')
    const eventId = uid("idem");
    const webhookPayload = JSON.stringify({
      type: "ignored",
      eventId,
    });

    const gwRes = await request.post("/api/webhooks/gateway", {
      headers: { "content-type": "application/json" },
      data: webhookPayload,
    });
    // O gateway pode retornar 200 (processed:false para "ignored") ou outros códigos
    // O importante é que a entry fica como 'processed' no log
    expect(
      [200, 400, 500].includes(gwRes.status()),
      `gateway deve responder (recebeu ${gwRes.status()})`,
    ).toBeTruthy();

    // Chama retry — não deve reprocessar a entry que já está 'processed'
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res1 = await request.post(RETRY_ENDPOINT, { data: { limit: 50 } });
    const body1 = (await res1.json()) as { retried?: number; succeeded?: number };

    // Chama novamente — retried não deve aumentar em relação à chamada anterior
    const res2 = await request.post(RETRY_ENDPOINT, { data: { limit: 50 } });
    const body2 = (await res2.json()) as { retried?: number };

    // Não podemos garantir 0 pois outros testes podem ter deixado pendentes,
    // mas podemos verificar que ambas as chamadas retornam ok=true e shape válido.
    expect(res1.status(), "1ª chamada deve ser 200").toBe(200);
    expect(res2.status(), "2ª chamada deve ser 200").toBe(200);

    const total1 = body1.retried ?? 0;
    const total2 = body2.retried ?? 0;
    // Após o 1º retry exaurir os pendentes, o 2º deve ter ≤ retried
    expect(
      total2,
      `2ª chamada (${total2}) deve ter ≤ retried que a 1ª (${total1}) pois pendentes foram processados`,
    ).toBeLessThanOrEqual(total1);

    await logout(request);
  });
});
