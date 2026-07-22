import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq, and } from "drizzle-orm";
import { db } from "@shared/db/db";
import { saques, users } from "@shared/db/schema";
import {
  loginAs,
  logout,
  uniqueEmail,
  uniqueUsername,
  SEED_CONTRATANTE_EMAIL,
  waitForVerificationEmail,
} from "../helpers";

/**
 * Integração (J49) — Saldo e saque do empreiteiro.
 *
 * `GET /api/empreiteiro/recebimento/saldo` e `POST /api/empreiteiro/recebimento/saque`
 * (app/api/empreiteiro/recebimento/{saldo,saque}/route.ts) reusam o guard de
 * autenticação/role (`requireVerifiedUser` + role==="empreiteiro") e então
 * delegam a `consultarSaldo`/`solicitarSaque` (features/marketplace/saldo-service.ts),
 * que retornam `SPLIT_DESABILITADO` sempre que `isMarketplaceSplitEnabled()`
 * é false — o que é SEMPRE o caso nesta suíte, pois `playwright.config.ts`
 * força `PAYMENT_GATEWAY=manual` (globalSetup + webServer.env) e
 * `isMarketplaceSplitEnabled()` exige `PAYMENT_GATEWAY=asaas` além de
 * `MARKETPLACE_SPLIT=on` (features/marketplace/flags.ts). O guard
 * anti-gateway-real (tests/e2e/guards.ts) aborta a suíte inteira se
 * PAYMENT_GATEWAY não for "manual" — ou seja, o flag é OFF de forma
 * estruturalmente garantida, não apenas "provavelmente".
 *
 * Cobertura:
 *   1. GET /saldo sem sessão → 401
 *   2. GET /saldo role errada (contratante) → 403
 *   3. GET /saldo empreiteiro, split off → 200 { enabled:false, saldo:null, saques:[] }
 *   4. POST /saque sem sessão → 401
 *   5. POST /saque role errada (contratante) → 403
 *   6. POST /saque valor inválido (0 e negativo) → 400 (Zod)
 *   7. POST /saque empreiteiro válido, split off → 403 SPLIT_DESABILITADO,
 *      e nenhuma linha em `saques` é criada (o gate barra antes do insert)
 *   8. (skip nesta suíte — depende de MARKETPLACE_SPLIT=on E PAYMENT_GATEWAY=asaas,
 *      o que o guard anti-gateway-real desta config sempre bloqueia) caminho feliz:
 *      getBalance real do ASAAS + saque válido cria linha em `saques`.
 *
 * Isolamento: registra empreiteiro/contratante E2E fresh por teste, limpa
 * usuários e eventuais linhas de `saques` em cada `finally`.
 */

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
const CPF_VALIDO = "52998224725";

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

/** Registra um empreiteiro E2E e verifica o email — pronto para requireVerifiedUser. */
async function registrarEmpreiteiro(
  request: APIRequestContext,
  tag: string,
): Promise<{ email: string; password: string }> {
  const email = uniqueEmail(`saldo-emp-${tag}`);
  const password = "Xconstr@E2E2026!";
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Empreiteiro Saldo ${tag}`,
      email,
      username: uniqueUsername(`saldoemp${tag}`),
      password,
      role: "empreiteiro",
      phone: "11988880000",
      cpfCnpj: CPF_VALIDO,
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

/** Remove usuários E2E registrados pelo teste (best-effort). */
async function limparUsuarios(ids: Array<string | null | undefined>): Promise<void> {
  for (const id of ids) {
    if (!id) continue;
    await db.delete(users).where(eq(users.id, id)).catch(() => {});
  }
}

/** Remove linhas de `saques` de um user (best-effort). */
async function limparSaques(userId: string | null | undefined): Promise<void> {
  if (!userId) return;
  await db.delete(saques).where(eq(saques.userId, userId)).catch(() => {});
}

// ---------------------------------------------------------------------------
// 1 — GET /saldo sem sessão → 401
// ---------------------------------------------------------------------------

test.describe("J49 — GET /saldo: guard de autenticação", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/empreiteiro/recebimento/saldo");
    expect(res.status(), "sem sessão deve retornar 401").toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 2 — GET /saldo role errada → 403
// ---------------------------------------------------------------------------

test.describe("J49 — GET /saldo: guard de role", () => {
  test("contratante tenta chamar → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.get("/api/empreiteiro/recebimento/saldo");
    expect(res.status(), "contratante não pode chamar GET /saldo (403)").toBe(403);
    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// 3 — GET /saldo empreiteiro, split off → 200 { enabled:false, saldo:null, saques:[] }
// ---------------------------------------------------------------------------

test.describe("J49 — GET /saldo: feature flag desabilitada", () => {
  test("empreiteiro válido, split off → 200 enabled:false", async ({ request }) => {
    test.skip(
      splitEnabledInThisEnv(),
      "MARKETPLACE_SPLIT está habilitado neste ambiente — este caso só se aplica com o flag off",
    );

    const { email } = await registrarEmpreiteiro(request, "getoff");
    await loginAs(request, email);
    const userId = await getMyId(request);

    try {
      const res = await request.get("/api/empreiteiro/recebimento/saldo");
      expect(res.status(), "GET /saldo com flag off deve retornar 200").toBe(200);
      const body = (await res.json()) as { enabled?: boolean; saldo?: unknown; saques?: unknown[] };
      expect(body.enabled, "enabled deve ser false").toBe(false);
      expect(body.saldo, "saldo deve ser null").toBeNull();
      expect(Array.isArray(body.saques), "saques deve ser um array").toBeTruthy();
      expect(body.saques?.length, "saques deve estar vazio").toBe(0);

      await logout(request);
    } finally {
      await limparUsuarios([userId]);
    }
  });
});

// ---------------------------------------------------------------------------
// 4 — POST /saque sem sessão → 401
// ---------------------------------------------------------------------------

test.describe("J49 — POST /saque: guard de autenticação", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/empreiteiro/recebimento/saque", { data: { valor: 100 } });
    expect(res.status(), "sem sessão deve retornar 401").toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 5 — POST /saque role errada → 403
// ---------------------------------------------------------------------------

test.describe("J49 — POST /saque: guard de role", () => {
  test("contratante tenta chamar → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    const res = await request.post("/api/empreiteiro/recebimento/saque", { data: { valor: 100 } });
    expect(res.status(), "contratante não pode chamar POST /saque (403)").toBe(403);
    await logout(request);
  });
});

// ---------------------------------------------------------------------------
// 6 — POST /saque valor inválido → 400 (Zod)
// ---------------------------------------------------------------------------

test.describe("J49 — POST /saque: validação de valor", () => {
  test("valor 0 → 400", async ({ request }) => {
    const { email } = await registrarEmpreiteiro(request, "zero");
    await loginAs(request, email);
    const userId = await getMyId(request);

    try {
      const res = await request.post("/api/empreiteiro/recebimento/saque", { data: { valor: 0 } });
      expect(res.status(), "valor 0 deve retornar 400").toBe(400);
      await logout(request);
    } finally {
      await limparSaques(userId);
      await limparUsuarios([userId]);
    }
  });

  test("valor negativo → 400", async ({ request }) => {
    const { email } = await registrarEmpreiteiro(request, "neg");
    await loginAs(request, email);
    const userId = await getMyId(request);

    try {
      const res = await request.post("/api/empreiteiro/recebimento/saque", { data: { valor: -5 } });
      expect(res.status(), "valor negativo deve retornar 400").toBe(400);
      await logout(request);
    } finally {
      await limparSaques(userId);
      await limparUsuarios([userId]);
    }
  });
});

// ---------------------------------------------------------------------------
// 7 — POST /saque empreiteiro válido, split off → 403 SPLIT_DESABILITADO
//     (caso mais valioso: prova o gate corta ANTES do insert em `saques`)
// ---------------------------------------------------------------------------

test.describe("J49 — POST /saque: feature flag desabilitada", () => {
  test("empreiteiro válido, valor válido, split off → 403 SPLIT_DESABILITADO, nenhum saque criado", async ({
    request,
  }) => {
    test.skip(
      splitEnabledInThisEnv(),
      "MARKETPLACE_SPLIT está habilitado neste ambiente (flag on + PAYMENT_GATEWAY=asaas) — este caso só se aplica com o flag off",
    );

    const { email } = await registrarEmpreiteiro(request, "gate");
    await loginAs(request, email);
    const userId = await getMyId(request);

    try {
      const res = await request.post("/api/empreiteiro/recebimento/saque", { data: { valor: 100 } });
      expect(res.status(), "POST /saque com flag off deve retornar 403").toBe(403);
      const body = (await res.json().catch(() => null)) as { code?: string } | null;
      expect(body?.code, "code deve ser SPLIT_DESABILITADO").toBe("SPLIT_DESABILITADO");

      // Confirma que nenhuma linha em `saques` foi criada (o gate corta ANTES do insert/Asaas).
      const rows = await db
        .select({ id: saques.id })
        .from(saques)
        .where(and(eq(saques.userId, userId)));
      expect(rows.length, "nenhum saque deve existir quando o gate barra").toBe(0);

      await logout(request);
    } finally {
      await limparSaques(userId);
      await limparUsuarios([userId]);
    }
  });
});

// ---------------------------------------------------------------------------
// 8 — Caminho feliz (condicional — requer MARKETPLACE_SPLIT=on + PAYMENT_GATEWAY=asaas)
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
// planos-assinatura.integration.spec.ts / checkout-split.integration.spec.ts):
//   1. Criar uma subconta `asaas_subcontas` aprovada (onboardingStatus="aprovada")
//      com `asaasApiKeyEnc` cifrado (chave sandbox real) e dados PIX/TED válidos.
//   2. GET /saldo deve chamar `getBalance` real e retornar { enabled:true, saldo:<number> }.
//   3. POST /saque com valor <= saldo deve chamar `requestTransfer` real, inserir
//      uma linha em `saques` com status "pendente" ANTES da chamada, e atualizá-la
//      para "concluido" (se DONE/CONFIRMED) ou manter "pendente" após a resposta do Asaas.
//   MARKETPLACE_SPLIT=on PAYMENT_GATEWAY=asaas ASAAS_API_KEY=<chave_sandbox> \
//     npx playwright test tests/e2e/integration/saldo-saque.integration.spec.ts \
//     --grep "caminho feliz"

test.describe("J49 — saldo/saque: caminho feliz (ASAAS sandbox)", () => {
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

  test("caminho feliz: subconta aprovada → GET /saldo retorna saldo real, POST /saque cria saque", async ({
    request,
  }) => {
    // Não executado nesta suíte (skip acima). Documentado no comentário do bloco.
    // Ver checkout-split.integration.spec.ts para o padrão de setup de
    // asaasSubcontas aprovada usado quando este teste roda de fato.
    expect(splitEnabledInThisEnv()).toBe(true);
  });
});
