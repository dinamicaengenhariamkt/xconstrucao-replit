/**
 * Testes E2E de integração — ciclo completo via webhook (J11 / J14).
 *
 * Cobre o caminho que o ManualGateway padrão (modo "activated") NÃO exercita:
 *
 *   POST /api/assinaturas/checkout  (header X-Manual-Gateway-Pending: 1)
 *     → kind:"redirect" + externalReference na URL
 *   POST /api/webhooks/gateway      (endpoint público real do projeto; nota: a doc da
 *     tarefa referia "/api/webhooks/asaas" mas o endpoint final do projeto é "/api/webhooks/gateway")
 *     → PAYMENT_RECEIVED → payment_succeeded → assinatura ativa + users.plano=pro
 *
 * O header `X-Manual-Gateway-Pending: 1` é um opt-in de testes que faz o
 * ManualGateway retornar `kind:"redirect"` em vez de ativar imediatamente,
 * simulando exatamente o comportamento do ASAAS em produção sem chamadas reais.
 *
 * O payload enviado a POST /api/webhooks/gateway usa o formato canônico ASAAS:
 *   { "event": "PAYMENT_RECEIVED", "payment": { "id", "subscription",
 *     "externalReference", "value" } }
 * — idêntico ao que o ASAAS envia em produção. ManualGateway.parseWebhook
 * mapeia este formato para o evento normalizado interno.
 *
 * Suites:
 *   1 — Ciclo completo via checkout pendente + PAYMENT_RECEIVED
 *   2 — PAYMENT_OVERDUE após ativa → inadimplente
 *   3 — SUBSCRIPTION_CANCELED após ativa → cancelada + downgrade para free
 *   4 — Reativação: inadimplente → payment_received → ativa novamente
 */

import { test, expect } from "@playwright/test";
import { loginAs, logout, SEED_EMPREITEIRO_EMAIL } from "../helpers";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Identificador único por run para evitar colisões no webhook_delivery_log. */
function uid(label: string): string {
  return `e2e_wh_${label}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

type PendingCheckoutResponse = {
  ok: boolean;
  kind: "redirect";
  url: string;
};

/**
 * Chama POST /api/assinaturas/checkout com X-Manual-Gateway-Pending:1.
 * Retorna o resultado parseado. Falha o teste se o status não for 200.
 */
async function doPendingCheckout(
  request: import("@playwright/test").APIRequestContext,
  planoId: string,
  ciclo: "mensal" | "anual" = "mensal",
): Promise<PendingCheckoutResponse & { gwSubId: string; externalReference: string }> {
  const res = await request.post("/api/assinaturas/checkout", {
    data: { planoId, ciclo },
    headers: { "X-Manual-Gateway-Pending": "1" },
  });

  expect(
    res.status(),
    `checkout pendente deve retornar 200, recebeu ${res.status()}`,
  ).toBe(200);

  const body = (await res.json()) as PendingCheckoutResponse;
  expect(body.kind, "checkout pendente deve retornar kind:redirect").toBe("redirect");
  expect(body.url, "URL de redirect deve conter ext=").toContain("ext=");

  const urlParams = new URL(body.url, "http://placeholder").searchParams;
  const externalReference = decodeURIComponent(urlParams.get("ext") ?? "");
  const gwSubId = decodeURIComponent(urlParams.get("gwSub") ?? "");

  expect(externalReference, "externalReference deve seguir o formato xconstrucao|...").toMatch(
    /^xconstrucao\|.+\|.+\|(mensal|anual)$/,
  );
  expect(gwSubId, "gwSubId deve estar na URL").toBeTruthy();

  return { ...body, gwSubId, externalReference };
}

/**
 * Dispara POST /api/webhooks/gateway com payload formato ASAAS.
 * Retorna { status, body }.
 */
async function fireAsaasWebhook(
  request: import("@playwright/test").APIRequestContext,
  event: "PAYMENT_RECEIVED" | "PAYMENT_CONFIRMED" | "PAYMENT_OVERDUE" | "PAYMENT_DELETED" | "SUBSCRIPTION_CANCELED" | "SUBSCRIPTION_INACTIVATED",
  payment: {
    id: string;
    subscription?: string;
    externalReference?: string;
    value?: number;
  },
) {
  const res = await request.post("/api/webhooks/gateway", {
    data: {
      event,
      payment: {
        id: payment.id,
        subscription: payment.subscription ?? null,
        externalReference: payment.externalReference ?? null,
        value: payment.value ?? 0,
      },
    },
  });
  const body = (await res.json()) as { received?: boolean; processed?: boolean; error?: string };
  return { status: res.status(), body };
}

/** GET /api/perfil/plano → { plano, assinaturaStatus }. */
async function getPerfilPlano(request: import("@playwright/test").APIRequestContext) {
  const res = await request.get("/api/perfil/plano");
  expect(res.status(), "GET /api/perfil/plano deve responder 200").toBe(200);
  return res.json() as Promise<{ plano: string; assinaturaStatus?: string }>;
}

/** GET /api/test/sub-setup?gatewaySubscriptionId=… → { status }. */
async function getSubStatus(
  request: import("@playwright/test").APIRequestContext,
  gwSubId: string,
) {
  const res = await request.get(`/api/test/sub-setup?gatewaySubscriptionId=${encodeURIComponent(gwSubId)}`);
  expect(res.status(), "GET /api/test/sub-setup deve responder 200").toBe(200);
  return res.json() as Promise<{ status: string }>;
}

/** Retorna o ID do usuário autenticado. */
async function getMyId(request: import("@playwright/test").APIRequestContext): Promise<string> {
  const res = await request.get("/api/auth/me");
  expect(res.status()).toBe(200);
  const data = (await res.json()) as { user?: { id?: string } };
  const id = data?.user?.id;
  expect(id, "user.id deve existir em /api/auth/me").toBeTruthy();
  return id!;
}

/** Busca o ID do plano Pro (empreiteiro). Retorna null se não encontrado. */
async function getProPlanoId(
  request: import("@playwright/test").APIRequestContext,
): Promise<string | null> {
  const res = await request.get("/api/planos");
  if (!res.ok()) return null;
  const data = await res.json() as Array<{ id: string; tier: string }>;
  if (!Array.isArray(data)) return null;
  return data.find((p) => p.tier === "pro")?.id ?? null;
}

/** Cancela a assinatura ativa (se houver). No-op se não houver. */
async function cancelarAssinatura(request: import("@playwright/test").APIRequestContext) {
  await request.post("/api/assinaturas/cancelar").catch(() => {});
}

// ---------------------------------------------------------------------------
// Suite 1 — Ciclo completo: checkout pendente → PAYMENT_RECEIVED → ativa
// ---------------------------------------------------------------------------

test.describe("Suite 1 — Ciclo completo via checkout pendente + PAYMENT_RECEIVED", () => {
  test("1a — checkout retorna redirect; PAYMENT_RECEIVED ativa a assinatura (tier=pro)", async ({
    request,
  }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    await cancelarAssinatura(request);

    const proPlanId = await getProPlanoId(request);
    test.skip(!proPlanId, "plano pro não encontrado");

    // 1. Verifica que antes do checkout o usuário está no plano free
    const antes = await getPerfilPlano(request);
    expect(antes.plano, "plano deve ser free antes do checkout").toBe("free");

    // 2. Checkout com header pendente → recebe redirect (pagamento pendente)
    const { gwSubId, externalReference } = await doPendingCheckout(request, proPlanId!);

    // 3. Após checkout (redirect), ainda não está ativo — webhook não foi disparado
    const pendente = await getPerfilPlano(request);
    expect(pendente.plano, "plano ainda deve ser free antes do webhook").toBe("free");

    // 4. ASAAS dispara PAYMENT_RECEIVED (formato de produção) → /api/webhooks/gateway
    const { status, body } = await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: uid("pay-1a"),
      subscription: gwSubId,
      externalReference,
      value: 99.9,
    });

    expect(status, "PAYMENT_RECEIVED deve retornar 200").toBe(200);
    expect(body.received, "webhook deve confirmar recebimento").toBe(true);
    expect(body.processed, "webhook deve confirmar processamento").toBe(true);

    // 5. Após webhook → assinatura ativa, tier=pro
    const depois = await getPerfilPlano(request);
    expect(depois.plano, "tier deve ser pro após PAYMENT_RECEIVED").toBe("pro");
    expect(depois.assinaturaStatus, "assinaturaStatus deve ser ativa").toBe("ativa");

    await cancelarAssinatura(request);
    await logout(request);
  });

  test("1b — PAYMENT_RECEIVED duplicado (mesmo id de pagamento) é idempotente", async ({
    request,
  }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    await cancelarAssinatura(request);

    const proPlanId = await getProPlanoId(request);
    test.skip(!proPlanId, "plano pro não encontrado");

    const { gwSubId, externalReference } = await doPendingCheckout(request, proPlanId!);

    const payId = uid("pay-1b");

    // Primeiro disparo — deve processar
    const primeiro = await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: payId,
      subscription: gwSubId,
      externalReference,
      value: 99.9,
    });
    expect(primeiro.status).toBe(200);
    expect(primeiro.body.processed, "1º PAYMENT_RECEIVED deve ser processado").toBe(true);

    // Segundo disparo com o MESMO id de pagamento — não deve reprocessar
    const segundo = await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: payId,
      subscription: gwSubId,
      externalReference,
      value: 99.9,
    });
    expect(segundo.status).toBe(200);
    expect(segundo.body.processed, "2º PAYMENT_RECEIVED duplicado deve ser idempotente (processed:false)").toBe(false);

    // Assinatura deve permanecer ativa (não duplicada)
    const perfil = await getPerfilPlano(request);
    expect(perfil.plano, "tier deve ser pro").toBe("pro");
    expect(perfil.assinaturaStatus, "status deve ser ativa").toBe("ativa");

    await cancelarAssinatura(request);
    await logout(request);
  });

  test("1c — PAYMENT_CONFIRMED também ativa a assinatura (alias de PAYMENT_RECEIVED)", async ({
    request,
  }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    await cancelarAssinatura(request);

    const proPlanId = await getProPlanoId(request);
    test.skip(!proPlanId, "plano pro não encontrado");

    const { gwSubId, externalReference } = await doPendingCheckout(request, proPlanId!);

    const { status, body } = await fireAsaasWebhook(request, "PAYMENT_CONFIRMED", {
      id: uid("pay-1c"),
      subscription: gwSubId,
      externalReference,
      value: 99.9,
    });

    expect(status, "PAYMENT_CONFIRMED deve retornar 200").toBe(200);
    expect(body.processed, "PAYMENT_CONFIRMED deve ser processado").toBe(true);

    const perfil = await getPerfilPlano(request);
    expect(perfil.plano, "tier deve ser pro após PAYMENT_CONFIRMED").toBe("pro");

    await cancelarAssinatura(request);
    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// Suite 2 — PAYMENT_OVERDUE após ativa → inadimplente
// ---------------------------------------------------------------------------

test.describe("Suite 2 — PAYMENT_OVERDUE → inadimplente", () => {
  test("2a — PAYMENT_OVERDUE marca assinatura como inadimplente (verifica via DB)", async ({
    request,
  }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    await cancelarAssinatura(request);

    const proPlanId = await getProPlanoId(request);
    test.skip(!proPlanId, "plano pro não encontrado");

    // Ativa via checkout pendente + PAYMENT_RECEIVED
    const { gwSubId, externalReference } = await doPendingCheckout(request, proPlanId!);
    await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: uid("pay-2a-init"),
      subscription: gwSubId,
      externalReference,
      value: 99.9,
    });

    // Confirma ativação via DB
    const dbAtiva = await getSubStatus(request, gwSubId);
    expect(dbAtiva.status, "assinatura deve estar ativa antes do overdue").toBe("ativa");

    // ASAAS dispara PAYMENT_OVERDUE (cobrança mensal em atraso)
    const { status, body } = await fireAsaasWebhook(request, "PAYMENT_OVERDUE", {
      id: uid("pay-2a-overdue"),
      subscription: gwSubId,
    });

    expect(status, "PAYMENT_OVERDUE deve retornar 200").toBe(200);
    expect(body.processed, "PAYMENT_OVERDUE deve ser processado").toBe(true);

    // Verifica via DB (evita ambiguidade do fallback sem ORDER BY em perfil/plano)
    const dbInad = await getSubStatus(request, gwSubId);
    expect(
      dbInad.status,
      "assinatura deve ser inadimplente no DB após PAYMENT_OVERDUE",
    ).toBe("inadimplente");

    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// Suite 3 — SUBSCRIPTION_CANCELED → cancelada + downgrade para free
// ---------------------------------------------------------------------------

test.describe("Suite 3 — SUBSCRIPTION_CANCELED → cancelada + tier=free", () => {
  test("3a — SUBSCRIPTION_CANCELED cancela assinatura e reverte tier para free", async ({
    request,
  }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    await cancelarAssinatura(request);

    const proPlanId = await getProPlanoId(request);
    test.skip(!proPlanId, "plano pro não encontrado");

    // Ativa
    const { gwSubId, externalReference } = await doPendingCheckout(request, proPlanId!);
    await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: uid("pay-3a-init"),
      subscription: gwSubId,
      externalReference,
      value: 99.9,
    });

    const ativa = await getPerfilPlano(request);
    expect(ativa.plano, "deve estar pro antes do cancelamento").toBe("pro");

    // ASAAS dispara SUBSCRIPTION_CANCELED
    const { status, body } = await fireAsaasWebhook(request, "SUBSCRIPTION_CANCELED", {
      id: uid("evt-3a-cancel"),
      subscription: gwSubId,
    });

    expect(status, "SUBSCRIPTION_CANCELED deve retornar 200").toBe(200);
    expect(body.processed, "SUBSCRIPTION_CANCELED deve ser processado").toBe(true);

    const cancelada = await getPerfilPlano(request);
    expect(cancelada.plano, "tier deve regredir para free após cancelamento").toBe("free");

    // Verifica via DB
    const dbCancel = await getSubStatus(request, gwSubId);
    expect(dbCancel.status, "assinatura deve estar cancelada no DB").toBe("cancelada");

    await logout(request);
  });

  test("3b — SUBSCRIPTION_INACTIVATED (alias) também cancela a assinatura", async ({
    request,
  }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    await cancelarAssinatura(request);

    const proPlanId = await getProPlanoId(request);
    test.skip(!proPlanId, "plano pro não encontrado");

    const { gwSubId, externalReference } = await doPendingCheckout(request, proPlanId!);
    await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: uid("pay-3b-init"),
      subscription: gwSubId,
      externalReference,
      value: 99.9,
    });

    const { status, body } = await fireAsaasWebhook(request, "SUBSCRIPTION_INACTIVATED", {
      id: uid("evt-3b-inact"),
      subscription: gwSubId,
    });

    expect(status, "SUBSCRIPTION_INACTIVATED deve retornar 200").toBe(200);
    expect(body.processed, "SUBSCRIPTION_INACTIVATED deve ser processado").toBe(true);

    const perfil = await getPerfilPlano(request);
    expect(perfil.plano, "tier deve ser free após SUBSCRIPTION_INACTIVATED").toBe("free");

    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// Suite 4 — Reativação: inadimplente → PAYMENT_RECEIVED → ativa novamente
// ---------------------------------------------------------------------------

test.describe("Suite 4 — Reativação: inadimplente → PAYMENT_RECEIVED → ativa", () => {
  test("4a — PAYMENT_OVERDUE → inadimplente; PAYMENT_RECEIVED reativa (via DB)", async ({
    request,
  }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    await cancelarAssinatura(request);

    const proPlanId = await getProPlanoId(request);
    test.skip(!proPlanId, "plano pro não encontrado");

    // Ativa via checkout pendente
    const { gwSubId, externalReference } = await doPendingCheckout(request, proPlanId!);
    await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: uid("pay-4a-init"),
      subscription: gwSubId,
      externalReference,
      value: 99.9,
    });

    // Confirma ativa
    expect((await getSubStatus(request, gwSubId)).status).toBe("ativa");

    // ASAAS dispara PAYMENT_OVERDUE → inadimplente
    await fireAsaasWebhook(request, "PAYMENT_OVERDUE", {
      id: uid("pay-4a-overdue"),
      subscription: gwSubId,
    });

    const dbInad = await getSubStatus(request, gwSubId);
    expect(
      dbInad.status,
      "deve ser inadimplente após PAYMENT_OVERDUE",
    ).toBe("inadimplente");

    // Cliente paga a fatura em atraso → ASAAS dispara PAYMENT_RECEIVED
    const { status, body } = await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: uid("pay-4a-reactivate"),
      subscription: gwSubId,
      value: 99.9,
    });

    expect(status, "webhook de reativação deve retornar 200").toBe(200);
    expect(body.processed, "reativação deve ser processada").toBe(true);

    // Verifica via DB
    const dbReativa = await getSubStatus(request, gwSubId);
    expect(
      dbReativa.status,
      "assinatura deve estar ativa no DB após reativação",
    ).toBe("ativa");

    // Verifica via perfil (users.plano atualizado)
    const perfil = await getPerfilPlano(request);
    expect(perfil.plano, "tier deve ser pro após reativação").toBe("pro");
    expect(perfil.assinaturaStatus, "assinaturaStatus deve ser ativa após reativação").toBe("ativa");

    await cancelarAssinatura(request);
    await logout(request);
  });

  test("4b — ciclo ponta-a-ponta completo: checkout → ativa → overdue → reativa → cancela", async ({
    request,
  }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    await cancelarAssinatura(request);

    const proPlanId = await getProPlanoId(request);
    test.skip(!proPlanId, "plano pro não encontrado");

    // Etapa 1: checkout pendente
    const { gwSubId, externalReference } = await doPendingCheckout(request, proPlanId!);
    expect(
      (await getPerfilPlano(request)).plano,
      "plano deve ser free antes do PAYMENT_RECEIVED",
    ).toBe("free");

    // Etapa 2: ativa via PAYMENT_RECEIVED
    await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: uid("pay-4b-init"),
      subscription: gwSubId,
      externalReference,
      value: 99.9,
    });
    expect((await getSubStatus(request, gwSubId)).status).toBe("ativa");

    // Etapa 3: PAYMENT_OVERDUE → inadimplente
    await fireAsaasWebhook(request, "PAYMENT_OVERDUE", {
      id: uid("pay-4b-overdue"),
      subscription: gwSubId,
    });
    expect((await getSubStatus(request, gwSubId)).status).toBe("inadimplente");

    // Etapa 4: PAYMENT_RECEIVED → reativa
    await fireAsaasWebhook(request, "PAYMENT_RECEIVED", {
      id: uid("pay-4b-reactivate"),
      subscription: gwSubId,
      value: 99.9,
    });
    expect((await getSubStatus(request, gwSubId)).status).toBe("ativa");
    expect((await getPerfilPlano(request)).plano).toBe("pro");

    // Etapa 5: SUBSCRIPTION_CANCELED → free
    await fireAsaasWebhook(request, "SUBSCRIPTION_CANCELED", {
      id: uid("evt-4b-cancel"),
      subscription: gwSubId,
    });
    expect((await getSubStatus(request, gwSubId)).status).toBe("cancelada");
    expect((await getPerfilPlano(request)).plano).toBe("free");

    await logout(request);
  });
});
