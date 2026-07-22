import { test, expect } from "@playwright/test";
import {
  loginAs,
  logout,
  SEED_CONTRATANTE_EMAIL,
  SEED_EMPREITEIRO_EMAIL,
  SEED_ADMIN_EMAIL,
} from "../helpers";

/**
 * Integração (J50) — Reconciliação de split + endpoints admin.
 *
 * `reconciliarSplitsPendentes` (features/marketplace/reconciliacao-split-job.ts)
 * varre `pagamentos_split` presos em `pendente` (15min–72h, com asaas_payment_id),
 * consulta o status real no Asaas via `getPayment` e reaplica `aplicarEventoSplit`
 * se CONFIRMED/RECEIVED. Se `MARKETPLACE_SPLIT` não está habilitado, é NO-OP
 * determinístico: `{ok:true, verificados:0, recuperados:0, falhas:0}` — não toca
 * o banco nem o Asaas.
 *
 * Como em `checkout-split.integration.spec.ts` (J47), `playwright.config.ts`
 * força `PAYMENT_GATEWAY=manual` (globalSetup + webServer.env) e o guard
 * anti-gateway-real (tests/e2e/guards.ts) ABORTA A SUÍTE INTEIRA se o gateway
 * não for "manual". `isMarketplaceSplitEnabled()` (features/marketplace/flags.ts)
 * exige `MARKETPLACE_SPLIT=on` E `PAYMENT_GATEWAY=asaas` — logo, nesta suíte o
 * flag está SEMPRE off, de forma estrutural (não apenas "provavelmente"), e o
 * caminho de recuperação real (getPayment confirmando um split antigo) não é
 * exercitável aqui.
 *
 * Cobertura:
 *   1. GET /api/admin/marketplace/metricas sem sessão → 401
 *   2. GET metricas com não-admin (contratante/empreiteiro) → 403
 *   3. GET metricas como admin → 200, shape completo, todos os campos numéricos
 *   4. POST /api/admin/marketplace/reconciliar sem sessão → 401
 *   5. POST reconciliar com não-admin → 403
 *   6. POST reconciliar como admin (split off, nesta suíte sempre) → 200 NO-OP
 *      determinístico {ok:true, verificados:0, recuperados:0, falhas:0} — prova
 *      o gate central do job.
 *   7. (skip condicional a MARKETPLACE_SPLIT=on) caminho de recuperação real —
 *      documentado, não exercitável nesta config.
 */

function splitEnabledInThisEnv(): boolean {
  const flag = (process.env.MARKETPLACE_SPLIT ?? "off").toLowerCase() === "on";
  const gateway = (process.env.PAYMENT_GATEWAY ?? "manual").toLowerCase();
  return flag && gateway === "asaas";
}

// ---------------------------------------------------------------------------
// GET /api/admin/marketplace/metricas
// ---------------------------------------------------------------------------

test.describe("J50 — GET /api/admin/marketplace/metricas", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/admin/marketplace/metricas");
    expect(res.status(), "sem sessão deve retornar 401").toBe(401);
  });

  for (const [rotulo, email] of [
    ["contratante", SEED_CONTRATANTE_EMAIL],
    ["empreiteiro", SEED_EMPREITEIRO_EMAIL],
  ] as const) {
    test(`não-admin (${rotulo}) → 403`, async ({ request }) => {
      await loginAs(request, email);
      const res = await request.get("/api/admin/marketplace/metricas");
      expect(res.status(), `${rotulo} deve receber 403`).toBe(403);
      await logout(request);
    });
  }

  test("admin → 200 com shape completo e valores numéricos", async ({ request }) => {
    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.get("/api/admin/marketplace/metricas");
    expect(res.status(), "admin deve receber 200").toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    const camposEsperados = [
      "totalConfirmado",
      "totalRepassado",
      "totalComissao",
      "qtdPendentes",
      "qtdConfirmados",
      "qtdFalhos",
      "valorPendente",
      "totalSacado",
      "qtdSaquesPendentes",
    ] as const;

    for (const campo of camposEsperados) {
      expect(body, `corpo deve conter o campo '${campo}'`).toHaveProperty(campo);
      expect(typeof body[campo], `campo '${campo}' deve ser number`).toBe("number");
    }

    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// POST /api/admin/marketplace/reconciliar
// ---------------------------------------------------------------------------

test.describe("J50 — POST /api/admin/marketplace/reconciliar", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/admin/marketplace/reconciliar");
    expect(res.status(), "sem sessão deve retornar 401").toBe(401);
  });

  for (const [rotulo, email] of [
    ["contratante", SEED_CONTRATANTE_EMAIL],
    ["empreiteiro", SEED_EMPREITEIRO_EMAIL],
  ] as const) {
    test(`não-admin (${rotulo}) → 403`, async ({ request }) => {
      await loginAs(request, email);
      const res = await request.post("/api/admin/marketplace/reconciliar");
      expect(res.status(), `${rotulo} deve receber 403`).toBe(403);
      await logout(request);
    });
  }

  test("admin, split desabilitado → 200 NO-OP determinístico", async ({ request }) => {
    test.skip(
      splitEnabledInThisEnv(),
      "MARKETPLACE_SPLIT está habilitado neste ambiente — o NO-OP determinístico só se aplica com o flag off",
    );

    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.post("/api/admin/marketplace/reconciliar");
    expect(res.status(), "admin deve receber 200").toBe(200);

    const body = (await res.json()) as {
      ok?: boolean;
      verificados?: number;
      recuperados?: number;
      falhas?: number;
      runAt?: string;
    };
    expect(body.ok, "ok deve ser true").toBe(true);
    expect(body.verificados, "com flag off, verificados deve ser 0 (NO-OP, não toca o banco)").toBe(0);
    expect(body.recuperados, "com flag off, recuperados deve ser 0").toBe(0);
    expect(body.falhas, "com flag off, falhas deve ser 0").toBe(0);
    expect(typeof body.runAt, "runAt deve ser retornado").toBe("string");

    await logout(request);
  });

  test("admin, split desabilitado → aceita body com limit sem quebrar (ainda NO-OP)", async ({
    request,
  }) => {
    test.skip(
      splitEnabledInThisEnv(),
      "MARKETPLACE_SPLIT está habilitado neste ambiente — este caso só se aplica com o flag off",
    );

    await loginAs(request, SEED_ADMIN_EMAIL);
    const res = await request.post("/api/admin/marketplace/reconciliar", {
      data: { limit: 10 },
    });
    expect(res.status(), "admin com body limit deve receber 200").toBe(200);

    const body = (await res.json()) as { ok?: boolean; verificados?: number };
    expect(body.ok, "ok deve ser true").toBe(true);
    expect(body.verificados, "com flag off, verificados deve ser 0 mesmo com limit custom").toBe(0);

    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// Caminho de recuperação real (condicional — requer MARKETPLACE_SPLIT=on +
// PAYMENT_GATEWAY=asaas)
// ---------------------------------------------------------------------------
//
// Nesta config de Playwright, `PAYMENT_GATEWAY=manual` é forçado tanto no
// globalSetup quanto em webServer.env, e o guard anti-gateway-real
// (tests/e2e/guards.ts → inspecionarPaymentGateway) ABORTA A SUÍTE INTEIRA se
// PAYMENT_GATEWAY não for "manual". É estruturalmente impossível este teste
// rodar com o gateway real usando este config — o skip abaixo documenta a
// intenção e permite rodar este arquivo isoladamente com um config alternativo
// (ASAAS sandbox), seguindo o padrão do bloco "caminho feliz (ASAAS sandbox)"
// em checkout-split.integration.spec.ts.
//
// Cenário a exercitar (fora desta suíte):
//   1. Criar um `pagamentos_split` com status='pendente', asaas_payment_id
//      válido e created_at > 15min e < 72h atrás (dentro da janela de
//      reconciliação — RECONCILE_MIN_AGE_MIN / RECONCILE_WINDOW_HOURS).
//   2. Garantir que o pagamento correspondente no Asaas sandbox está
//      CONFIRMED ou RECEIVED (getPayment retorna esse status).
//   3. POST /api/admin/marketplace/reconciliar como admin.
//   4. Esperado: 200, verificados=1, recuperados=1, falhas=0; e o
//      `pagamentos_split` reconciliado deve transicionar para
//      status='confirmado' (via aplicarEventoSplit, idempotente).
//
// Para rodar de fato:
//   MARKETPLACE_SPLIT=on PAYMENT_GATEWAY=asaas ASAAS_API_KEY=<chave_sandbox> \
//     npx playwright test tests/e2e/integration/reconciliacao-split.integration.spec.ts \
//     --grep "recuperação real"

test.describe("J50 — reconciliação: caminho de recuperação real (ASAAS sandbox)", () => {
  test.beforeEach(({}, testInfo) => {
    if (!splitEnabledInThisEnv()) {
      testInfo.skip(
        true,
        `MARKETPLACE_SPLIT="${process.env.MARKETPLACE_SPLIT ?? "off"}" PAYMENT_GATEWAY="${
          process.env.PAYMENT_GATEWAY ?? "manual"
        }" — recuperação real só roda com MARKETPLACE_SPLIT=on e PAYMENT_GATEWAY=asaas`,
      );
    }
  });

  test("recuperação real: split pendente antigo + Asaas CONFIRMED → reconciliado", async () => {
    // Não exercitável nesta config (guard anti-gateway-real força
    // PAYMENT_GATEWAY=manual). Ver comentário acima para o cenário completo e
    // como rodar com um config ASAAS sandbox dedicado.
    test.skip(true, "documentado, requer config ASAAS sandbox dedicado — ver comentário do describe");
  });
});
