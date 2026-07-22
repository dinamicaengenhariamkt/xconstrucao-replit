import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { asaasSubcontas } from "@shared/db/schema";
import { loginAs, logout, uniqueEmail, uniqueUsername } from "../helpers";

/**
 * Integração (J46) — Webhook de status de subconta / KYC do ASAAS.
 *
 * Cobre o roteamento de `type: "account_status_changed"` do simulador
 * `POST /api/test/webhooks/asaas` para `aplicarEventoSubconta`
 * (features/marketplace/aplicar-evento-subconta.ts), que localiza a
 * subconta por `asaas_account_id` e transiciona `onboarding_status`:
 *
 *   accountStatus:"approved" → 'aprovada'
 *   accountStatus:"rejected" → 'rejeitada'
 *   accountStatus:"pending"  → 'aguardando_kyc' (nunca regride de 'aprovada')
 *
 * Suites:
 *   1 — Aprovação: aguardando_kyc → aprovada
 *   2 — Idempotência: status já 'aprovada' → 2º evento processed:false, sem mudar
 *   3 — Rejeição: aguardando_kyc → rejeitada
 *   4 — accountId inexistente → processed:false, 200 (sem erro)
 *   5 — REGRESSÃO: evento de assinatura (payment_succeeded) continua roteando
 *       para aplicarEventoWebhook e criando a assinatura (roteamento não quebrou
 *       o caminho de assinatura).
 *
 * Isolamento: cada teste cria um empreiteiro E2E fresh via /api/auth/register
 * e insere a linha de `asaas_subcontas` diretamente via drizzle (não há
 * endpoint público para isso — é dado de infra do onboarding KYC). Cleanup
 * via db.delete no afterEach (users é limpo em cascade pela FK, mas como não
 * apagamos o user aqui, removemos a subconta explicitamente).
 *
 * Pré-requisitos: E2E_TEST_AUTH=1 (playwright.config.ts webServer.env).
 */

const ENDPOINT = "/api/test/webhooks/asaas";

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
const CPF_VALIDO = "52998224725";

function uniqueEventId(tag: string): string {
  return `E2E-subconta-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function uniqueAccountId(tag: string): string {
  return `E2E-acc-${tag}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

async function post(request: APIRequestContext, body: unknown) {
  return request.post(ENDPOINT, {
    headers: { "content-type": "application/json" },
    data: body,
  });
}

/** Registra um empreiteiro E2E fresh e retorna { email, password }. */
async function registrarNovoEmpreiteiro(
  request: APIRequestContext,
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail("subconta-wh");
  const password = "Xconstr@E2E2026!";
  const res = await request.post("/api/auth/register", {
    data: {
      name: "E2E Empreiteiro Subconta",
      email,
      username: uniqueUsername("subcontawh"),
      password,
      role: "empreiteiro",
      phone: "11966660000",
      cpfCnpj: CPF_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(
    [200, 201].includes(res.status()),
    `registro E2E empreiteiro deve funcionar, recebeu ${res.status()}`,
  ).toBeTruthy();
  return { email, password };
}

/** Retorna o ID do usuário autenticado via /api/auth/me (payload plano, sem wrapper). */
async function getMyId(request: APIRequestContext): Promise<string> {
  const res = await request.get("/api/auth/me");
  expect(res.status()).toBe(200);
  const data = (await res.json()) as { id?: string };
  const id = data?.id;
  expect(id, "id deve existir em /api/auth/me").toBeTruthy();
  return id!;
}

/** Cria um empreiteiro E2E logado + insere subconta 'aguardando_kyc' com accountId conhecido. */
async function criarEmpreiteiroComSubconta(
  request: APIRequestContext,
  tag: string,
): Promise<{ userId: string; accountId: string; subcontaId: string }> {
  const { email } = await registrarNovoEmpreiteiro(request);
  await loginAs(request, email);
  const userId = await getMyId(request);
  const accountId = uniqueAccountId(tag);

  const [row] = await db
    .insert(asaasSubcontas)
    .values({
      userId,
      asaasAccountId: accountId,
      onboardingStatus: "aguardando_kyc",
    })
    .returning({ id: asaasSubcontas.id });

  return { userId, accountId, subcontaId: row.id };
}

async function getOnboardingStatus(subcontaId: string): Promise<string> {
  const [row] = await db
    .select({ onboardingStatus: asaasSubcontas.onboardingStatus })
    .from(asaasSubcontas)
    .where(eq(asaasSubcontas.id, subcontaId))
    .limit(1);
  return row?.onboardingStatus ?? "NAO_ENCONTRADA";
}

test.describe("Webhook de subconta (J46) — aprovação", () => {
  test("account_status_changed approved → onboarding_status='aprovada' no banco", async ({
    request,
  }) => {
    const { accountId, subcontaId } = await criarEmpreiteiroComSubconta(request, "aprov");
    await logout(request);

    expect(await getOnboardingStatus(subcontaId), "antes do evento deve estar aguardando_kyc").toBe(
      "aguardando_kyc",
    );

    const res = await post(request, {
      type: "account_status_changed",
      eventId: uniqueEventId("aprov"),
      accountId,
      accountStatus: "approved",
    });

    expect(res.status(), "esperado 200").toBe(200);
    const body = (await res.json()) as { received?: boolean; processed?: boolean };
    expect(body.received).toBe(true);
    expect(body.processed, "evento de aprovação deve ser processado").toBe(true);

    expect(
      await getOnboardingStatus(subcontaId),
      "onboarding_status deve virar 'aprovada' no banco",
    ).toBe("aprovada");

    await db.delete(asaasSubcontas).where(eq(asaasSubcontas.id, subcontaId));
  });
});

test.describe("Webhook de subconta (J46) — idempotência", () => {
  test("mesmo eventId reenviado após status já 'aprovada' → 2ª chamada processed:false, status inalterado", async ({
    request,
  }) => {
    const { accountId, subcontaId } = await criarEmpreiteiroComSubconta(request, "idem");
    await logout(request);

    const eventId = uniqueEventId("idem");
    const payload = {
      type: "account_status_changed",
      eventId,
      accountId,
      accountStatus: "approved",
    };

    const first = await post(request, payload);
    expect(first.status()).toBe(200);
    const firstBody = (await first.json()) as { processed?: boolean };
    expect(firstBody.processed, "1º envio deve ser processado (transição real)").toBe(true);
    expect(await getOnboardingStatus(subcontaId)).toBe("aprovada");

    // Reenvia o MESMO evento (mesmo eventId). Como o status já é 'aprovada',
    // a transição é um no-op e o handler retorna processed:false.
    const second = await post(request, payload);
    expect(second.status()).toBe(200);
    const secondBody = (await second.json()) as { processed?: boolean };
    expect(
      secondBody.processed,
      "2º envio (status já era 'aprovada', sem mudança) deve ser processed:false",
    ).toBe(false);

    expect(
      await getOnboardingStatus(subcontaId),
      "status deve permanecer 'aprovada' após reenvio",
    ).toBe("aprovada");

    await db.delete(asaasSubcontas).where(eq(asaasSubcontas.id, subcontaId));
  });
});

test.describe("Webhook de subconta (J46) — rejeição", () => {
  test("account_status_changed rejected → onboarding_status='rejeitada' no banco", async ({
    request,
  }) => {
    const { accountId, subcontaId } = await criarEmpreiteiroComSubconta(request, "rej");
    await logout(request);

    const res = await post(request, {
      type: "account_status_changed",
      eventId: uniqueEventId("rej"),
      accountId,
      accountStatus: "rejected",
    });

    expect(res.status()).toBe(200);
    const body = (await res.json()) as { processed?: boolean };
    expect(body.processed, "evento de rejeição deve ser processado").toBe(true);

    expect(
      await getOnboardingStatus(subcontaId),
      "onboarding_status deve virar 'rejeitada' no banco",
    ).toBe("rejeitada");

    await db.delete(asaasSubcontas).where(eq(asaasSubcontas.id, subcontaId));
  });
});

test.describe("Webhook de subconta (J46) — accountId inexistente", () => {
  test("accountId sem subconta correspondente → 200 processed:false, sem erro", async ({
    request,
  }) => {
    const res = await post(request, {
      type: "account_status_changed",
      eventId: uniqueEventId("nofound"),
      accountId: "E2E-acc-INEXISTENTE-nao-existe",
      accountStatus: "approved",
    });

    expect(res.status(), "accountId inexistente não deve gerar erro 500").toBe(200);
    const body = (await res.json()) as { received?: boolean; processed?: boolean };
    expect(body.received).toBe(true);
    expect(body.processed, "sem subconta correspondente → processed:false").toBe(false);
  });
});

test.describe("Webhook de subconta (J46) — regressão do caminho de assinatura", () => {
  test("payment_succeeded via simulador continua roteando para aplicarEventoWebhook (não quebrou com o roteamento de conta)", async ({
    request,
  }) => {
    const res = await post(request, {
      type: "payment_succeeded",
      eventId: uniqueEventId("regr-sub"),
      externalReference:
        "xconstrucao|00000000-0000-0000-0000-000000000001|00000000-0000-0000-0000-000000000001|mensal",
      gatewayCustomerId: "cus_sim_E2E_regr",
      valor: 99.9,
    });

    expect(res.status(), "payment_succeeded deve continuar retornando 200").toBe(200);
    const body = (await res.json()) as { received?: boolean; processed?: boolean };
    expect(body.received).toBe(true);
    expect(
      body.processed,
      "evento de assinatura deve ser processado normalmente (evento registrado)",
    ).toBe(true);
  });
});
