import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { AsaasGateway } from "./asaas-gateway";

process.env.ASAAS_API_KEY = "test-api-key-unit";
process.env.ASAAS_ENVIRONMENT = "sandbox";
process.env.NEXT_PUBLIC_BASE_URL = "https://test.xconstrucao.com.br";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

const input = {
  userId: "user-uuid-1234",
  planoId: "plano-uuid-pro",
  tier: "pro" as const,
  ciclo: "mensal" as const,
  valor: 49.9,
  planoNome: "Plano Basic",
  userEmail: "user@example.com",
  userName: "Test User",
  userCpfCnpj: "11222333000181",
  userAsaasCustomerId: "cus_legacy",
  successUrl: "https://test.xconstrucao.com.br/planos/sucesso",
  cancelUrl: "https://test.xconstrucao.com.br/xgestao/configuracoes?tab=plano",
};

describe("AsaasGateway.createCheckout — contrato recorrente atual", () => {
  it("envia billingTypes/chargeTypes/subscription e não envia customer incompleto", async () => {
    let requestBody: Record<string, unknown> | undefined;
    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      assert.match(String(url), /\/checkouts$/);
      requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return new Response(JSON.stringify({ id: "checkout_123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const result = await new AsaasGateway().createCheckout(input);

    assert.deepEqual(requestBody?.billingTypes, ["CREDIT_CARD"]);
    assert.deepEqual(requestBody?.chargeTypes, ["RECURRENT"]);
    assert.equal(requestBody?.minutesToExpire, 60);
    assert.equal("billingType" in (requestBody ?? {}), false);
    assert.equal("chargeType" in (requestBody ?? {}), false);
    assert.equal("cycle" in (requestBody ?? {}), false);
    assert.equal("customer" in (requestBody ?? {}), false);
    assert.equal("customerData" in (requestBody ?? {}), false);
    assert.equal(
      (requestBody?.subscription as { cycle?: string })?.cycle,
      "MONTHLY",
    );
    assert.match(
      (requestBody?.subscription as { nextDueDate?: string })?.nextDueDate ?? "",
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
    assert.deepEqual(requestBody?.callback, {
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
      expiredUrl: input.cancelUrl,
    });
    assert.deepEqual(result, {
      kind: "redirect",
      url: "https://sandbox.asaas.com/checkoutSession/show?id=checkout_123",
    });
  });

  it("preserva a URL quando o Asaas ainda a retorna na resposta", async () => {
    global.fetch = (async () => new Response(JSON.stringify({
      id: "checkout_legacy",
      url: "https://sandbox.asaas.com/c/checkout_legacy",
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })) as typeof fetch;

    const result = await new AsaasGateway().createCheckout({
      ...input,
      ciclo: "anual",
    });

    assert.equal(result.kind, "redirect");
    assert.equal(result.url, "https://sandbox.asaas.com/c/checkout_legacy");
  });
});