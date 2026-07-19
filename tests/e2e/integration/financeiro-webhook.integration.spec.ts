import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, logout } from "../helpers";

/**
 * Integração (J36) — Financeiro/Medições + Webhook de gateway.
 *
 * O caminho feliz do financeiro (aceite → valorTotal; quitação → valorPago) já
 * é coberto por `j40-financeiro-totais.spec.ts`. Aqui focamos nos buracos:
 *   - T4.4 Webhook de gateway (o maior gap): idempotência por gatewayEventId e
 *          evento de tipo desconhecido → ignored. Endpoint PÚBLICO.
 *   - T4.2 Medições: guards de autorização/estado (empreiteiro não aprova; aprovar
 *          medição inexistente → 4xx, não 500).
 *
 * IMPORTANTE sobre o gateway: o adapter padrão em teste é o `manual`
 * (features/planos/gateway/manual-gateway.ts) — ele NÃO valida assinatura e
 * mapeia `type` desconhecido para "ignored". Por isso o teste "assinatura
 * inválida → 400" só se aplica a adapters reais (J14) e fica registrado como
 * gap na J36. Aqui exercitamos o que o manual realmente garante: idempotência
 * (índice único em assinatura_eventos.gateway_event_id) e o ramo "ignored".
 *
 * Os eventos de teste usam `gatewaySubscriptionId` INEXISTENTE de propósito:
 * `aplicarEventoWebhook` não encontra assinatura → não faz nenhum UPDATE em
 * dados reais, só insere uma linha em assinatura_eventos (assinaturaId=null).
 * Efeito colateral nulo sobre assinaturas/usuários reais.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; seed com maria
 * (empreiteiro). PAYMENT_GATEWAY não definido → adapter manual.
 */

const EMPREITEIRO_EMAIL = "maria@empreiteira.com";


/** eventId único e rastreável (contém E2E para auditoria/limpeza manual futura). */
function uniqueEventId(): string {
  return `E2E-int-evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

test.describe("Integração — Webhook de gateway (idempotência + ignored)", () => {
  test("evento sem type (→ ignored pelo adapter) → 200 { processed: false }", async ({ request }) => {
    // O adapter manual mapeia type AUSENTE para "ignored" (type presente é
    // repassado literalmente). O handler responde { processed: false } no ramo
    // ignored, sem tocar o banco.
    const res = await request.post("/api/webhooks/gateway", {
      data: { eventId: uniqueEventId() }, // sem `type` → ignored
    });
    expect(res.status(), "webhook deve responder 200 para evento ignorado").toBe(200);
    const body = (await res.json()) as { received?: boolean; processed?: boolean };
    expect(body.processed, "evento ignorado não deve ser processado").toBe(false);
  });

  test("idempotência: mesmo eventId processado 2x → 1ª processed:true, 2ª processed:false", async ({
    request,
  }) => {
    const eventId = uniqueEventId();
    // Evento com subscription inexistente: não toca assinaturas reais, só registra o evento.
    const payload = {
      eventId,
      type: "subscription_activated",
      gatewaySubscriptionId: "manual_sub_INEXISTENTE_E2E",
    };

    const first = await request.post("/api/webhooks/gateway", { data: payload });
    expect(first.status(), "primeiro envio deve responder 200").toBe(200);
    const firstBody = (await first.json()) as { processed?: boolean };
    expect(firstBody.processed, "primeiro envio deve ser processado").toBe(true);

    const second = await request.post("/api/webhooks/gateway", { data: payload });
    expect(second.status(), "segundo envio (duplicado) deve responder 200").toBe(200);
    const secondBody = (await second.json()) as { processed?: boolean };
    expect(
      secondBody.processed,
      "evento duplicado (mesmo eventId) NÃO deve ser reprocessado",
    ).toBe(false);
  });

  test("webhook é público (não exige autenticação)", async ({ request }) => {
    // Sem login: o endpoint deve aceitar a chamada (é o gateway quem chama).
    const res = await request.post("/api/webhooks/gateway", {
      data: { eventId: uniqueEventId(), type: "ignored" },
    });
    expect(res.status(), "webhook público não deve exigir auth (não 401/403)").toBe(200);
  });

  test("body vazio/malformado não derruba o endpoint (não 500)", async ({ request }) => {
    // O adapter manual tolera body vazio → type=ignored. Nunca deve estourar 500.
    const res = await request.post("/api/webhooks/gateway", {
      headers: { "content-type": "application/json" },
      data: "",
    });
    expect(res.status(), "body vazio não deve retornar 500").not.toBe(500);
    expect([200, 400].includes(res.status()), `esperado 200/400 (recebeu ${res.status()})`).toBeTruthy();
  });
});

test.describe("Integração — Webhook reativação de assinatura inadimplente", () => {
  const CONTRATANTE_EMAIL = "joao@construtora.com";

  /**
   * Monta um payload no formato ASAS (o gateway ativo neste ambiente).
   * O ASAS adapter lê body.event, body.payment.id e body.payment.subscription
   * para montar eventId e gatewaySubscriptionId.
   */
  function asaasPaymentConfirmedPayload(paymentId: string, subscriptionId: string) {
    return {
      event: "PAYMENT_CONFIRMED",
      payment: {
        id: paymentId,
        subscription: subscriptionId,
        value: 99.9,
      },
    };
  }

  test("ciclo anual: PAYMENT_CONFIRMED reativa com renovaEm +12 meses (não +1)", async ({ request }) => {
    const gSubId = `E2E-sub-anual-${Date.now().toString(36)}`;
    const payId = `E2E-pay-anual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    // 1. Cria assinatura inadimplente com ciclo=anual.
    const setup = await request.post("/api/test/sub-setup", {
      data: { email: CONTRATANTE_EMAIL, ciclo: "anual", gatewaySubscriptionId: gSubId },
    });
    expect(setup.ok(), `sub-setup deve responder ok (status ${setup.status()})`).toBeTruthy();

    // 2. Dispara PAYMENT_CONFIRMED no formato ASAS.
    const wh = await request.post("/api/webhooks/gateway", {
      data: asaasPaymentConfirmedPayload(payId, gSubId),
    });
    expect(wh.status(), "webhook deve responder 200").toBe(200);
    const whBody = (await wh.json()) as { processed?: boolean };
    expect(whBody.processed, "evento deve ser processado").toBe(true);

    // 3. Verifica que renovaEm foi estendida ~12 meses (não ~1 mês).
    const state = await request.get(`/api/test/sub-setup?gatewaySubscriptionId=${encodeURIComponent(gSubId)}`);
    expect(state.ok(), `leitura do estado deve responder ok (status ${state.status()})`).toBeTruthy();
    const sub = (await state.json()) as { status?: string; ciclo?: string; renovaEm?: string };

    expect(sub.status, "assinatura deve estar ativa após pagamento").toBe("ativa");
    expect(sub.ciclo, "ciclo deve ser anual").toBe("anual");

    // renovaEm deve ser ~12 meses à frente (tolerância: entre 11 e 13 meses).
    const renovaEm = new Date(sub.renovaEm!);
    const now = new Date();
    const diffMs = renovaEm.getTime() - now.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    expect(
      diffMonths >= 11 && diffMonths <= 13,
      `renovaEm deve ser ~12 meses à frente para ciclo anual (recebeu ${diffMonths.toFixed(1)} meses)`,
    ).toBeTruthy();
  });

  test("ciclo mensal: PAYMENT_CONFIRMED reativa com renovaEm +1 mês", async ({ request }) => {
    const gSubId = `E2E-sub-mensal-${Date.now().toString(36)}`;
    const payId = `E2E-pay-mensal-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const setup = await request.post("/api/test/sub-setup", {
      data: { email: CONTRATANTE_EMAIL, ciclo: "mensal", gatewaySubscriptionId: gSubId },
    });
    expect(setup.ok(), `sub-setup deve responder ok (status ${setup.status()})`).toBeTruthy();

    const wh = await request.post("/api/webhooks/gateway", {
      data: asaasPaymentConfirmedPayload(payId, gSubId),
    });
    expect(wh.status(), "webhook deve responder 200").toBe(200);
    const whBody = (await wh.json()) as { processed?: boolean };
    expect(whBody.processed, "evento deve ser processado").toBe(true);

    const state = await request.get(`/api/test/sub-setup?gatewaySubscriptionId=${encodeURIComponent(gSubId)}`);
    expect(state.ok(), `leitura do estado deve responder ok (status ${state.status()})`).toBeTruthy();
    const sub = (await state.json()) as { status?: string; ciclo?: string; renovaEm?: string };

    expect(sub.status, "assinatura deve estar ativa após pagamento").toBe("ativa");
    const renovaEm = new Date(sub.renovaEm!);
    const now = new Date();
    const diffMonths = (renovaEm.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    expect(
      diffMonths >= 0.5 && diffMonths <= 1.5,
      `renovaEm deve ser ~1 mês à frente para ciclo mensal (recebeu ${diffMonths.toFixed(1)} meses)`,
    ).toBeTruthy();
  });
});

test.describe("Integração — Medições: guards de autorização/estado", () => {
  test("empreiteiro não aprova medição (rota é do contratante → 4xx)", async ({ request }) => {
    await loginAs(request, EMPREITEIRO_EMAIL);
    // Rota de aprovação é role-gated para contratante. Empreiteiro → 403/404.
    const res = await request.post(
      "/api/contratante/medicoes/00000000-0000-0000-0000-000000000000/aprovar",
      { data: {} },
    );
    expect(
      [401, 403, 404].includes(res.status()),
      `empreiteiro não deve aprovar medição (esperado 401/403/404, recebeu ${res.status()})`,
    ).toBeTruthy();
    expect(res.status(), "jamais deve retornar 200").not.toBe(200);
    await logout(request);
  });

  test("aprovar medição inexistente → 4xx (não 500)", async ({ request }) => {
    // Como contratante (joão), tentar aprovar um id inexistente deve dar 404/4xx, não 500.
    const cRes = await request.post("/api/test/login-as", {
      data: { email: "joao@construtora.com" },
    });
    expect(cRes.ok(), "login-as joão deve responder ok").toBeTruthy();

    const res = await request.post(
      "/api/contratante/medicoes/00000000-0000-0000-0000-000000000000/aprovar",
      { data: {} },
    );
    expect(res.status(), "medição inexistente não deve retornar 500").not.toBe(500);
    expect(
      res.status() >= 400 && res.status() < 500,
      `esperado 4xx (recebeu ${res.status()})`,
    ).toBeTruthy();
    await logout(request);
  });
});
