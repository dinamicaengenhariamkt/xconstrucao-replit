import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { financeiro, pagamentosSplit, asaasSubcontas, users } from "@shared/db/schema";
import {
  loginAs,
  logout,
  uniqueEmail,
  uniqueUsername,
  SEED_EMPREITEIRO_EMAIL,
  waitForVerificationEmail,
} from "../helpers";

/**
 * Integração (J47) — Checkout de obra com split.
 *
 * `POST /api/contratante/pagamentos/[id]/checkout-split` reusa os guards do
 * fluxo manual (auth, role, ownership, já-pago, disputa) e então delega a
 * `iniciarCheckoutSplit`, que retorna `SPLIT_DESABILITADO` (403) quando o
 * feature flag `MARKETPLACE_SPLIT` está off — o que é sempre o caso nesta
 * suíte, pois `playwright.config.ts` força `PAYMENT_GATEWAY=manual` no
 * `webServer.env` e `isMarketplaceSplitEnabled()` exige `PAYMENT_GATEWAY=asaas`
 * além de `MARKETPLACE_SPLIT=on` (features/marketplace/flags.ts). Ou seja: o
 * flag é OFF de forma determinística e garantida pelo guard anti-gateway-real
 * (tests/e2e/guards.ts), não apenas "provavelmente".
 *
 * Cobertura:
 *   1. Sem sessão → 401
 *   2. Role errada (empreiteiro) → 403
 *   3. Lançamento inexistente → 404
 *   4. Não é dono (outro contratante) → 403
 *   5. Split desabilitado (dono válido, lançamento pendente) → 403 SPLIT_DESABILITADO
 *   6. GET /api/contratante/pagamentos → nenhum item com splitElegivel:true quando
 *      o flag está off
 *   7. (skip nesta suíte — depende de MARKETPLACE_SPLIT=on E PAYMENT_GATEWAY=asaas,
 *      o que o guard anti-gateway-real desta config sempre bloqueia) caminho feliz:
 *      subconta aprovada + checkout real no ASAAS sandbox → 200 + pagamentos_split
 *      pendente.
 *
 * Isolamento: cria financeiro/users E2E fresh por teste, limpa em cada teste
 * (não usa afterEach global porque os registros variam por caso).
 */

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
const CPF_VALIDO = "52998224725";
// Empreiteiro se cadastra como pessoa jurídica (registerSchema exige CNPJ).
const CNPJ_VALIDO = "11222333000181";

function splitEnabledInThisEnv(): boolean {
  const flag = (process.env.MARKETPLACE_SPLIT ?? "off").toLowerCase() === "on";
  const gateway = (process.env.PAYMENT_GATEWAY ?? "manual").toLowerCase();
  return flag && gateway === "asaas";
}

/**
 * Verifica o email de um usuário recém-registrado via link capturado
 * (EMAIL_TEST_MODE=1), necessário porque `requireVerifiedUser` bloqueia com
 * 403 EMAIL_NOT_VERIFIED usuários com emailVerified=false.
 */
async function verificarEmail(request: APIRequestContext, email: string): Promise<void> {
  const captured = await waitForVerificationEmail(request, email);
  const verifyUrl = captured.meta?.verificationUrl as string;
  const token = new URL(verifyUrl).searchParams.get("token");
  expect(token, `token de verificação deve existir no link capturado para ${email}`).toBeTruthy();
  const res = await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token!)}`, {
    maxRedirects: 0,
  });
  expect(
    res.headers()["location"] ?? "",
    `verify-email deveria confirmar o email de ${email}`,
  ).toContain("success=");
}

/** Registra um contratante E2E e verifica o email — pronto para requireVerifiedUser. */
async function registrarContratante(
  request: APIRequestContext,
  tag: string,
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail(`split-ctr-${tag}`);
  const password = "Xconstr@E2E2026!";
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Contratante Split ${tag}`,
      email,
      username: uniqueUsername(`splitctr${tag}`),
      password,
      role: "contratante",
      phone: "11977770000",
      cpfCnpj: CPF_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(
    [200, 201].includes(res.status()),
    `registro E2E contratante deve funcionar, recebeu ${res.status()}`,
  ).toBeTruthy();
  await verificarEmail(request, email);
  return { email, password };
}

/** Registra um empreiteiro E2E e verifica o email — pronto para requireVerifiedUser. */
async function registrarEmpreiteiro(
  request: APIRequestContext,
  tag: string,
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail(`split-emp-${tag}`);
  const password = "Xconstr@E2E2026!";
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Empreiteiro Split ${tag}`,
      email,
      username: uniqueUsername(`splitemp${tag}`),
      password,
      role: "empreiteiro",
      phone: "11988880000",
      cpfCnpj: CNPJ_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect(
    [200, 201].includes(res.status()),
    `registro E2E empreiteiro deve funcionar, recebeu ${res.status()}`,
  ).toBeTruthy();
  await verificarEmail(request, email);
  return { email, password };
}

async function getMyId(request: APIRequestContext): Promise<string> {
  const res = await request.get("/api/auth/me");
  expect(res.status()).toBe(200);
  const data = (await res.json()) as { id?: string };
  expect(data?.id, "id deve existir em /api/auth/me").toBeTruthy();
  return data.id!;
}

/** Insere um lançamento `financeiro` pendente de obra (pagador/recebedor diretos). */
async function criarFinanceiroPendente(args: {
  pagadorUserId: string;
  recebedorUserId: string;
  valor?: number;
}): Promise<string> {
  const [row] = await db
    .insert(financeiro)
    .values({
      tipo: "saida",
      descricao: "E2E Split — pagamento de obra",
      valor: String(args.valor ?? 1000),
      data: new Date().toISOString().slice(0, 10),
      escopo: "obra",
      categoria: "Medição",
      status: "pendente",
      pagadorUserId: args.pagadorUserId,
      recebedorUserId: args.recebedorUserId,
    })
    .returning({ id: financeiro.id });
  return row.id;
}

async function limparFinanceiro(id: string | null | undefined): Promise<void> {
  if (!id) return;
  await db.delete(pagamentosSplit).where(eq(pagamentosSplit.financeiroId, id)).catch(() => {});
  await db.delete(financeiro).where(eq(financeiro.id, id)).catch(() => {});
}

/** Remove usuários E2E registrados pelo teste (best-effort). */
async function limparUsuarios(ids: Array<string | null | undefined>): Promise<void> {
  for (const id of ids) {
    if (!id) continue;
    await db.delete(users).where(eq(users.id, id)).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// 1 — Sem sessão → 401
// ---------------------------------------------------------------------------

test.describe("J47 — checkout-split: guard de autenticação", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post(
      "/api/contratante/pagamentos/00000000-0000-0000-0000-000000000000/checkout-split",
    );
    expect(res.status(), "sem sessão deve retornar 401").toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 2 — Role errada → 403
// ---------------------------------------------------------------------------

test.describe("J47 — checkout-split: guard de role", () => {
  test("empreiteiro tenta chamar → 403", async ({ request }) => {
    await loginAs(request, SEED_EMPREITEIRO_EMAIL);
    const res = await request.post(
      "/api/contratante/pagamentos/00000000-0000-0000-0000-000000000000/checkout-split",
    );
    expect(res.status(), "empreiteiro não pode chamar checkout-split (403)").toBe(403);
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    expect(body?.error, "erro deve ser FORBIDDEN").toBe("FORBIDDEN");
    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// 3 — Lançamento inexistente → 404
// ---------------------------------------------------------------------------

test.describe("J47 — checkout-split: lançamento inexistente", () => {
  test("id aleatório sem lançamento correspondente → 404", async ({ request }) => {
    const { email } = await registrarContratante(request, "404");
    await loginAs(request, email);
    const userId = await getMyId(request);

    try {
      const res = await request.post(
        "/api/contratante/pagamentos/00000000-0000-0000-0000-000000000000/checkout-split",
      );
      expect(res.status(), "lançamento inexistente deve retornar 404").toBe(404);
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      expect(body?.error, "erro deve ser NOT_FOUND").toBe("NOT_FOUND");

      await logout(request);
    } finally {
      await limparUsuarios([userId]);
    }
  });
});

// ---------------------------------------------------------------------------
// 4 — Não é dono → 403
// ---------------------------------------------------------------------------

test.describe("J47 — checkout-split: ownership", () => {
  test("contratante que não é dono do lançamento → 403", async ({ request }) => {
    const dono = await registrarContratante(request, "owner");
    const outro = await registrarContratante(request, "intruso");
    const empreiteiro = await registrarEmpreiteiro(request, "owner");

    await loginAs(request, dono.email);
    const donoId = await getMyId(request);
    await logout(request);

    await loginAs(request, outro.email);
    const outroId = await getMyId(request);
    await logout(request);

    await loginAs(request, empreiteiro.email);
    const empreiteiroId = await getMyId(request);
    await logout(request);

    const financeiroId = await criarFinanceiroPendente({
      pagadorUserId: donoId,
      recebedorUserId: empreiteiroId,
    });

    try {
      await loginAs(request, outro.email);
      const res = await request.post(`/api/contratante/pagamentos/${financeiroId}/checkout-split`);
      expect(res.status(), "contratante que não é dono deve receber 403").toBe(403);
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      expect(body?.error, "erro deve ser FORBIDDEN").toBe("FORBIDDEN");
      await logout(request);
    } finally {
      await limparFinanceiro(financeiroId);
      await limparUsuarios([donoId, outroId, empreiteiroId]);
    }
  });
});

// ---------------------------------------------------------------------------
// 5 — Split desabilitado → 403 SPLIT_DESABILITADO (caso mais valioso: prova o gate)
// ---------------------------------------------------------------------------

test.describe("J47 — checkout-split: feature flag desabilitada", () => {
  test("dono de lançamento pendente válido → 403 SPLIT_DESABILITADO quando MARKETPLACE_SPLIT está off", async ({
    request,
  }) => {
    test.skip(
      splitEnabledInThisEnv(),
      "MARKETPLACE_SPLIT está habilitado neste ambiente (flag on + PAYMENT_GATEWAY=asaas) — este caso só se aplica com o flag off",
    );

    const contratante = await registrarContratante(request, "gate");
    const empreiteiro = await registrarEmpreiteiro(request, "gate");

    await loginAs(request, contratante.email);
    const contratanteId = await getMyId(request);
    await logout(request);

    await loginAs(request, empreiteiro.email);
    const empreiteiroId = await getMyId(request);
    await logout(request);

    const financeiroId = await criarFinanceiroPendente({
      pagadorUserId: contratanteId,
      recebedorUserId: empreiteiroId,
    });

    try {
      await loginAs(request, contratante.email);
      const res = await request.post(`/api/contratante/pagamentos/${financeiroId}/checkout-split`);
      expect(res.status(), "checkout-split com flag off deve retornar 403").toBe(403);
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      expect(body?.error, "erro deve ser SPLIT_DESABILITADO").toBe("SPLIT_DESABILITADO");

      // Confirma que nenhum pagamentos_split foi criado (o gate corta ANTES de tocar o Asaas/banco).
      const splitRows = await db
        .select({ id: pagamentosSplit.id })
        .from(pagamentosSplit)
        .where(eq(pagamentosSplit.financeiroId, financeiroId));
      expect(splitRows.length, "nenhum pagamentos_split deve existir quando o gate barra").toBe(0);

      await logout(request);
    } finally {
      await limparFinanceiro(financeiroId);
      await limparUsuarios([contratanteId, empreiteiroId]);
    }
  });
});

// ---------------------------------------------------------------------------
// 6 — splitElegivel na lista de pagamentos
// ---------------------------------------------------------------------------

test.describe("J47 — GET /api/contratante/pagamentos: splitElegivel", () => {
  test("com flag off, nenhum item vem com splitElegivel:true", async ({ request }) => {
    test.skip(
      splitEnabledInThisEnv(),
      "MARKETPLACE_SPLIT está habilitado neste ambiente — splitElegivel pode ser true legitimamente",
    );

    const contratante = await registrarContratante(request, "list");
    const empreiteiro = await registrarEmpreiteiro(request, "list");

    await loginAs(request, contratante.email);
    const contratanteId = await getMyId(request);
    await logout(request);

    await loginAs(request, empreiteiro.email);
    const empreiteiroId = await getMyId(request);
    await logout(request);

    const financeiroId = await criarFinanceiroPendente({
      pagadorUserId: contratanteId,
      recebedorUserId: empreiteiroId,
    });

    try {
      await loginAs(request, contratante.email);
      const res = await request.get("/api/contratante/pagamentos");
      expect(res.status(), "GET /api/contratante/pagamentos deve responder 200").toBe(200);

      const rows = (await res.json()) as Array<{ id: string; splitElegivel?: boolean }>;
      expect(Array.isArray(rows), "deve retornar array").toBeTruthy();

      const item = rows.find((r) => r.id === financeiroId);
      expect(item, "o lançamento E2E criado deve aparecer na lista do contratante").toBeTruthy();
      expect(
        item?.splitElegivel,
        "splitElegivel deve ser false/ausente quando o flag está off",
      ).toBeFalsy();

      // Assert mais amplo: NENHUM item da lista deve vir com splitElegivel:true
      // enquanto o flag estiver off, independente de a quem pertença.
      const algumElegivel = rows.some((r) => r.splitElegivel === true);
      expect(algumElegivel, "nenhum item deve ter splitElegivel:true com o flag off").toBe(false);

      await logout(request);
    } finally {
      await limparFinanceiro(financeiroId);
      await limparUsuarios([contratanteId, empreiteiroId]);
    }
  });
});

// ---------------------------------------------------------------------------
// 7 — Caminho feliz (condicional — requer MARKETPLACE_SPLIT=on + PAYMENT_GATEWAY=asaas)
// ---------------------------------------------------------------------------
//
// Nesta config de Playwright, `PAYMENT_GATEWAY=manual` é forçado tanto no
// globalSetup (process.env.PAYMENT_GATEWAY = "manual" no topo do
// playwright.config.ts) quanto em webServer.env, e o guard anti-gateway-real
// (tests/e2e/guards.ts → inspecionarPaymentGateway) ABORTA A SUÍTE INTEIRA se
// PAYMENT_GATEWAY não for "manual". Ou seja: é estruturalmente impossível este
// teste rodar com o gateway real usando este config — o skip abaixo é
// redundante em relação ao guard, mas documenta a intenção e permite rodar
// este arquivo isoladamente com um config alternativo (ASAAS sandbox) sem
// editar o teste.
//
// Para rodar de fato (fora desta suíte, com um playwright.config dedicado a
// sandbox ASAAS, seguindo o padrão do bloco "ASAAS Sandbox" em
// planos-assinatura.integration.spec.ts):
//   MARKETPLACE_SPLIT=on PAYMENT_GATEWAY=asaas ASAAS_API_KEY=<chave_sandbox> \
//     npx playwright test tests/e2e/integration/checkout-split.integration.spec.ts \
//     --grep "caminho feliz"

test.describe("J47 — checkout-split: caminho feliz (ASAAS sandbox)", () => {
  test.beforeEach(({}, testInfo) => {
    if (!splitEnabledInThisEnv()) {
      testInfo.skip(
        true,
        `MARKETPLACE_SPLIT="${process.env.MARKETPLACE_SPLIT ?? "off"}" PAYMENT_GATEWAY="${
          process.env.PAYMENT_GATEWAY ?? "manual"
        }" — caminho feliz só roda com MARKETPLACE_SPLIT=on e PAYMENT_GATEWAY=asaas`,
      );
    }
  });

  test("caminho feliz: recebedor com subconta aprovada → 200 + pagamentos_split pendente", async ({
    request,
  }) => {
    const contratante = await registrarContratante(request, "happy");
    const empreiteiro = await registrarEmpreiteiro(request, "happy");

    await loginAs(request, contratante.email);
    const contratanteId = await getMyId(request);
    await logout(request);

    await loginAs(request, empreiteiro.email);
    const empreiteiroId = await getMyId(request);
    await logout(request);

    const [subconta] = await db
      .insert(asaasSubcontas)
      .values({
        userId: empreiteiroId,
        asaasAccountId: `E2E-acc-happy-${Date.now().toString(36)}`,
        walletId: `E2E-wallet-happy-${Date.now().toString(36)}`,
        onboardingStatus: "aprovada",
      })
      .returning({ id: asaasSubcontas.id });

    const financeiroId = await criarFinanceiroPendente({
      pagadorUserId: contratanteId,
      recebedorUserId: empreiteiroId,
    });

    try {
      await loginAs(request, contratante.email);
      const res = await request.post(`/api/contratante/pagamentos/${financeiroId}/checkout-split`);
      expect(res.status(), "checkout-split com subconta aprovada deve retornar 200").toBe(200);

      const body = (await res.json()) as { ok?: boolean; url?: string };
      expect(body.ok, "resposta deve ter ok:true").toBe(true);
      expect(typeof body.url === "string" && body.url.length > 0, "url deve ser retornada").toBeTruthy();

      const [splitRow] = await db
        .select({ status: pagamentosSplit.status })
        .from(pagamentosSplit)
        .where(eq(pagamentosSplit.financeiroId, financeiroId))
        .limit(1);
      expect(splitRow?.status, "pagamentos_split deve estar pendente").toBe("pendente");

      await logout(request);
    } finally {
      await limparFinanceiro(financeiroId);
      await db.delete(asaasSubcontas).where(eq(asaasSubcontas.id, subconta.id)).catch(() => {});
      await limparUsuarios([contratanteId, empreiteiroId]);
    }
  });
});
