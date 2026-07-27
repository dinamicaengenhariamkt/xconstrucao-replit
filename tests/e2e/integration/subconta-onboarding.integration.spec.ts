import { test, expect, type APIRequestContext } from "@playwright/test";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import {
  loginAs,
  logout,
  uniqueEmail,
  uniqueUsername,
  waitForVerificationEmail,
  SEED_CONTRATANTE_EMAIL,
} from "../helpers";

/**
 * Integração (J45) — Onboarding da subconta de recebimento do empreiteiro.
 *
 * `GET/POST /api/empreiteiro/recebimento/subconta` era o último endpoint de
 * mutação fora da baseline do radar de cobertura (J36). Fecha o gap junto com
 * `/api/admin/obras-health` (coberto no spec da J57).
 *
 * O endpoint tem três camadas antes de tocar o ASAAS: `requireVerifiedUser`,
 * guard de role (`empreiteiro`) e o gate `isMarketplaceSplitEnabled()`. Nesta
 * suíte o gate é SEMPRE off — `playwright.config.ts` força `PAYMENT_GATEWAY=manual`
 * e o guard anti-gateway-real (tests/e2e/guards.ts) aborta a suíte inteira se não
 * for; `isMarketplaceSplitEnabled()` exige `asaas` além de `MARKETPLACE_SPLIT=on`.
 * Ou seja: o caminho feliz (criação real de subconta) não é testável aqui por
 * construção — o que é testável, e é o que importa para regressão, são os guards
 * e a validação de payload, que rodam ANTES do gate.
 *
 * Cobertura:
 *   1. GET sem sessão → 401
 *   2. GET com role errada (contratante) → 403
 *   3. GET empreiteiro com split off → 200 { enabled:false, subconta:null }
 *   4. POST sem sessão → 401
 *   5. POST com role errada → 403
 *   6. POST empreiteiro com payload inválido → 400 (Zod), nunca 500
 *   7. POST empreiteiro com payload válido e split off → 403 SPLIT_DESABILITADO
 */

const ANTI_BOT = { website: "", mountedAt: Date.now() - 5_000 };
const CPF_VALIDO = "52998224725";
// Empreiteiro se cadastra como pessoa jurídica (registerSchema exige CNPJ).
const CNPJ_VALIDO = "11222333000181";
const URL_SUBCONTA = "/api/empreiteiro/recebimento/subconta";

function splitEnabledInThisEnv(): boolean {
  const flag = (process.env.MARKETPLACE_SPLIT ?? "off").toLowerCase() === "on";
  const gateway = (process.env.PAYMENT_GATEWAY ?? "manual").toLowerCase();
  return flag && gateway === "asaas";
}

async function verificarEmail(request: APIRequestContext, email: string): Promise<void> {
  const captured = await waitForVerificationEmail(request, email);
  const token = new URL(captured.meta?.verificationUrl as string).searchParams.get("token");
  expect(token, `token de verificação para ${email}`).toBeTruthy();
  const res = await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token!)}`, {
    maxRedirects: 0,
  });
  expect(res.headers()["location"] ?? "", `verify-email de ${email}`).toContain("success=");
}

/** Registra um empreiteiro E2E verificado (requireVerifiedUser barra não-verificado). */
async function registrarEmpreiteiro(
  request: APIRequestContext,
  tag: string,
): Promise<{ email: string; id: string }> {
  const email = uniqueEmail(`subconta-emp-${tag}`);
  const res = await request.post("/api/auth/register", {
    data: {
      name: `E2E Empreiteiro Subconta ${tag}`,
      email,
      username: uniqueUsername(`subemp${tag}`),
      password: "Xconstr@E2E2026!",
      role: "empreiteiro",
      phone: "11988880000",
      cpfCnpj: CNPJ_VALIDO,
      acceptTerms: true,
      ...ANTI_BOT,
    },
  });
  expect([200, 201].includes(res.status()), `registro E2E: ${res.status()}`).toBeTruthy();
  await verificarEmail(request, email);

  await loginAs(request, email);
  const me = await request.get("/api/auth/me");
  expect(me.status()).toBe(200);
  const id = ((await me.json()) as { id?: string }).id;
  expect(id, "id em /api/auth/me").toBeTruthy();
  await logout(request);
  return { email, id: id! };
}

async function limparUsuario(id: string | null | undefined): Promise<void> {
  if (!id) return;
  await db.delete(users).where(eq(users.id, id)).catch(() => {});
}

const PAYLOAD_PIX_VALIDO = { tipoConta: "PIX", pixChave: "e2e-subconta@xconstrucao.test", pixTipo: "EMAIL" };

test.describe("Integração — J45: subconta de recebimento (guards e validação)", () => {
  test("GET sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get(URL_SUBCONTA);
    expect(res.status(), "sem sessão deve retornar 401").toBe(401);
  });

  test("POST sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post(URL_SUBCONTA, { data: PAYLOAD_PIX_VALIDO });
    expect(res.status(), "sem sessão deve retornar 401").toBe(401);
  });

  test("GET e POST com role errada (contratante) → 403", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE_EMAIL);
    try {
      const get = await request.get(URL_SUBCONTA);
      expect(get.status(), "contratante não acessa recebimento do empreiteiro").toBe(403);

      const post = await request.post(URL_SUBCONTA, { data: PAYLOAD_PIX_VALIDO });
      expect(post.status(), "contratante não configura subconta").toBe(403);
    } finally {
      await logout(request);
    }
  });

  test("empreiteiro: GET reflete o gate, payload inválido → 400 e válido → 403 com split off", async ({ request }) => {
    const emp = await registrarEmpreiteiro(request, `${Date.now().toString(36)}`);
    try {
      await loginAs(request, emp.email);

      // 3 — GET: com o split off o endpoint responde 200 anunciando que o
      // recurso está desligado (não 403), para a tela renderizar o estado certo.
      const get = await request.get(URL_SUBCONTA);
      expect(get.status(), `GET empreiteiro: ${await get.text()}`).toBe(200);
      const body = (await get.json()) as { enabled?: boolean; subconta?: unknown };
      if (splitEnabledInThisEnv()) {
        expect(body.enabled, "split on nesta env → enabled true").toBe(true);
      } else {
        expect(body.enabled, "split off → enabled false").toBe(false);
        expect(body.subconta, "split off → sem subconta").toBeNull();
      }

      // 6 — Validação de payload roda ANTES do gate: PIX sem chave é 400, não 500.
      const invalido = await request.post(URL_SUBCONTA, { data: { tipoConta: "PIX" } });
      expect(invalido.status(), "PIX sem chave deve ser 400 (Zod), nunca 500").toBe(400);

      const tedIncompleto = await request.post(URL_SUBCONTA, {
        data: { tipoConta: "TED", bancoCodigo: "001" },
      });
      expect(tedIncompleto.status(), "TED sem agência/conta deve ser 400").toBe(400);

      // 7 — Payload válido com o gate desligado: 403 SPLIT_DESABILITADO.
      test.skip(splitEnabledInThisEnv(), "MARKETPLACE_SPLIT ligado nesta env — caminho feliz toca o ASAAS real");
      const valido = await request.post(URL_SUBCONTA, { data: PAYLOAD_PIX_VALIDO });
      expect(valido.status(), `POST válido com split off: ${await valido.text()}`).toBe(403);
      const erro = (await valido.json()) as { code?: string };
      expect(erro.code, "403 do gate deve trazer code=SPLIT_DESABILITADO").toBe("SPLIT_DESABILITADO");
    } finally {
      await logout(request);
      await limparUsuario(emp.id);
    }
  });
});
