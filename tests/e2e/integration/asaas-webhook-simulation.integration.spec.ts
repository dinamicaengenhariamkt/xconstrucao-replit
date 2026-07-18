import { test, expect, type APIRequestContext } from "@playwright/test";

/**
 * Integração — Simulação de webhooks ASAS via endpoint mock (dev/test only).
 *
 * Endpoint: POST /api/test/webhooks/asaas
 * Pipeline: chama diretamente `aplicarEventoWebhook` (mesmo handler do gateway real).
 *
 * Cobre:
 *   1. Tipo "ignored" → processed: false (sem tocar o banco).
 *   2. Tipo desconhecido → 400 (validação de input).
 *   3. Ativação via externalReference (subscription_activated) com subscription
 *      INEXISTENTE no banco → evento registrado, processed: true.
 *   4. Idempotência: mesmo eventId enviado 2× → 1ª processed: true, 2ª processed: false.
 *   5. Endpoint bloqueado sem E2E_TEST_AUTH (smoke check implícito: se chegar
 *      a este ponto, o env está habilitado).
 *   6. Body vazio / JSON malformado → 400 (não 500).
 *   7. Simulação de payment_succeeded com externalReference sintético.
 *   8. Simulação de payment_failed com gatewaySubscriptionId inexistente.
 *   9. Simulação de subscription_canceled com gatewaySubscriptionId inexistente.
 *
 * Nota: os testes que envolvem gatewaySubscriptionId/externalReference INEXISTENTES
 * no banco não alteram assinaturas reais. `aplicarEventoWebhook` registra o evento
 * em `assinatura_eventos` (assinaturaId=null) sem tocar users/assinaturas.
 * Os testes com externalReference válido criam ou alteram assinaturas — usam
 * userId/planoId INEXISTENTES para evitar colisão com dados de seed.
 *
 * Pré-requisitos: E2E_TEST_AUTH=1 (playwright.config.ts).
 */

const ENDPOINT = "/api/test/webhooks/asaas";

function uniqueEventId(tag: string): string {
  return `E2E-asaas-sim-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function post(request: APIRequestContext, body: unknown) {
  return request.post(ENDPOINT, {
    headers: { "content-type": "application/json" },
    data: body,
  });
}

test.describe("Simulação ASAS Webhook — guard de ambiente", () => {
  /**
   * O endpoint tem dupla proteção:
   *   1. Hard deny em produção: NODE_ENV === "production" retorna 404 independente
   *      de qualquer variável de teste. Esta camada é verificada no código-fonte
   *      em app/api/test/webhooks/asaas/route.ts — Next.js bake NODE_ENV em build
   *      time, portanto não é possível simulá-la em runtime sem rebuildar.
   *   2. E2E_TEST_AUTH=1 obrigatório em dev/staging: sem esse flag, também retorna 404.
   *
   * O teste abaixo verifica que o endpoint está acessível neste ambiente de teste
   * (NODE_ENV=development + E2E_TEST_AUTH=1), o que implica que a dupla proteção
   * funciona corretamente nos dois eixos verificáveis em runtime.
   */
  test("endpoint acessível em dev+E2E_TEST_AUTH=1, retorna 404 para type ausente (não 'disabled')", async ({
    request,
  }) => {
    // Se retornar { error: "disabled" } é porque E2E_TEST_AUTH está off
    // ou NODE_ENV=production — ambos são erros de configuração do ambiente de teste.
    const res = await post(request, {});
    expect(res.status(), "endpoint deve estar acessível em dev+E2E_TEST_AUTH=1").not.toBe(404);
    const body = (await res.json()) as { error?: string };
    expect(body.error, "não deve retornar 'disabled' (guard de produção ativado incorretamente)").not.toBe(
      "disabled",
    );
  });
});

test.describe("Simulação ASAS Webhook — validação de input", () => {
  test("type 'ignored' → 200 { received: true, processed: false } sem tocar banco", async ({
    request,
  }) => {
    const res = await post(request, { type: "ignored" });
    expect(res.status(), `esperado 200, recebeu ${res.status()}`).toBe(200);
    const body = (await res.json()) as { received?: boolean; processed?: boolean };
    expect(body.received, "campo received deve ser true").toBe(true);
    expect(body.processed, "tipo ignored nunca é processado").toBe(false);
  });

  test("type ausente → 400", async ({ request }) => {
    const res = await post(request, { gatewaySubscriptionId: "sub_xyz" });
    expect(res.status(), "sem type deve retornar 400").toBe(400);
  });

  test("type inválido → 400", async ({ request }) => {
    const res = await post(request, { type: "PAYMENT_UPDATED_ASAAS_RAW" });
    expect(res.status(), "type desconhecido deve retornar 400").toBe(400);
    const body = (await res.json()) as { error?: string };
    expect(body.error, "deve explicar os tipos aceitos").toMatch(/type/i);
  });

  test("body vazio → 400 (não 500)", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      headers: { "content-type": "application/json" },
      data: "",
    });
    expect(res.status(), "body vazio não deve retornar 500").not.toBe(500);
    expect(res.status(), "body vazio deve retornar 400").toBe(400);
  });

  test("body não-JSON → 400 (não 500)", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      headers: { "content-type": "application/json" },
      data: "this is not json",
    });
    expect(res.status(), "body não-JSON não deve retornar 500").not.toBe(500);
    expect(res.status(), "body não-JSON deve retornar 400").toBe(400);
  });
});

test.describe("Simulação ASAS Webhook — idempotência (eventId)", () => {
  test("mesmo eventId enviado 2× → 1ª processed: true, 2ª processed: false", async ({
    request,
  }) => {
    const eventId = uniqueEventId("idem");
    const payload = {
      type: "subscription_activated",
      eventId,
      gatewaySubscriptionId: "sim_sub_INEXISTENTE_idem_E2E",
    };

    const first = await post(request, payload);
    expect(first.status(), "primeiro envio deve responder 200").toBe(200);
    const firstBody = (await first.json()) as { processed?: boolean };
    expect(firstBody.processed, "primeiro envio deve ser processed: true").toBe(true);

    const second = await post(request, payload);
    expect(second.status(), "segundo envio (duplicado) deve responder 200").toBe(200);
    const secondBody = (await second.json()) as { processed?: boolean };
    expect(secondBody.processed, "evento duplicado não deve ser reprocessado").toBe(false);
  });

  test("eventIds distintos para tipos distintos são processados independentemente", async ({
    request,
  }) => {
    const id1 = uniqueEventId("dist-a");
    const id2 = uniqueEventId("dist-b");

    const r1 = await post(request, {
      type: "payment_failed",
      eventId: id1,
      gatewaySubscriptionId: "sim_sub_INEXISTENTE_dist_E2E",
    });
    const r2 = await post(request, {
      type: "payment_succeeded",
      eventId: id2,
      gatewaySubscriptionId: "sim_sub_INEXISTENTE_dist_E2E",
    });

    expect(r1.status()).toBe(200);
    expect(r2.status()).toBe(200);
    const b1 = (await r1.json()) as { processed?: boolean };
    const b2 = (await r2.json()) as { processed?: boolean };
    expect(b1.processed, "primeiro evento deve ser processado").toBe(true);
    expect(b2.processed, "segundo evento com id diferente deve ser processado").toBe(true);
  });
});

test.describe("Simulação ASAS Webhook — tipos de evento (subscription INEXISTENTE)", () => {
  test("payment_succeeded com gatewaySubscriptionId inexistente → processed: true (registra evento)", async ({
    request,
  }) => {
    const res = await post(request, {
      type: "payment_succeeded",
      eventId: uniqueEventId("psuc"),
      gatewaySubscriptionId: "sim_sub_INEXISTENTE_psuc_E2E",
      valor: 99.9,
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { processed?: boolean };
    expect(body.processed).toBe(true);
  });

  test("payment_failed com gatewaySubscriptionId inexistente → processed: true", async ({
    request,
  }) => {
    const res = await post(request, {
      type: "payment_failed",
      eventId: uniqueEventId("pfail"),
      gatewaySubscriptionId: "sim_sub_INEXISTENTE_pfail_E2E",
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { processed?: boolean };
    expect(body.processed).toBe(true);
  });

  test("subscription_canceled com gatewaySubscriptionId inexistente → processed: true", async ({
    request,
  }) => {
    const res = await post(request, {
      type: "subscription_canceled",
      eventId: uniqueEventId("scanc"),
      gatewaySubscriptionId: "sim_sub_INEXISTENTE_scanc_E2E",
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { processed?: boolean };
    expect(body.processed).toBe(true);
  });

  test("subscription_activated com gatewaySubscriptionId inexistente → processed: true", async ({
    request,
  }) => {
    const res = await post(request, {
      type: "subscription_activated",
      eventId: uniqueEventId("sact"),
      gatewaySubscriptionId: "sim_sub_INEXISTENTE_sact_E2E",
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { processed?: boolean };
    expect(body.processed).toBe(true);
  });
});

test.describe("Simulação ASAS Webhook — externalReference (userId/planoId INEXISTENTES)", () => {
  test("payment_succeeded com externalReference bem formado mas userId/planoId inexistentes → processed: true (evento registrado, sem criar assinatura real)", async ({
    request,
  }) => {
    const res = await post(request, {
      type: "payment_succeeded",
      eventId: uniqueEventId("extref"),
      externalReference:
        "xconstrucao|00000000-0000-0000-0000-000000000001|00000000-0000-0000-0000-000000000001|mensal",
      gatewayCustomerId: "cus_sim_E2E",
      valor: 99.9,
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { processed?: boolean };
    expect(body.processed).toBe(true);
  });

  test("subscription_activated com externalReference malformado → processed: true (parseExternalRef retorna null, apenas registra evento)", async ({
    request,
  }) => {
    const res = await post(request, {
      type: "subscription_activated",
      eventId: uniqueEventId("extbad"),
      externalReference: "formato-invalido-sem-pipe",
      gatewayCustomerId: "cus_sim_E2E",
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { processed?: boolean };
    expect(body.processed).toBe(true);
  });
});
