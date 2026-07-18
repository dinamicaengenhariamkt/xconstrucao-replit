import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  uniqueEmail,
  uniqueUsername,
  fetchCapturedEmails,
  clearCapturedEmails,
  type CapturedEmail,
} from "../helpers";

/**
 * Integração (J36) — G1: auth-links / tokens de autenticação.
 *
 * Cobre os fluxos baseados em token/link, que até aqui não tinham cobertura de
 * integração (só o E2E de navegador em `onboarding.spec.ts` tocava no link de
 * verificação). Endpoints:
 *   - GET  /api/auth/verify-email?token=      (sempre redirect 302)
 *   - POST /api/auth/forgot-password          (dispara o link de reset)
 *   - POST /api/auth/reset-password           (token no body)
 *   - POST /api/auth/resend-verification
 *   - POST /api/auth/definir-senha-inicial    (único token single-use REAL)
 *
 * Descoberta técnica (ver J36 §10, 2026-07-18): verify-email e reset-password
 * usam JWT HMAC *stateless* (sem coluna no banco) — assertável expiração e
 * assinatura, NÃO reuso (verify reusado → already_verified; reset reusado →
 * redefine de novo, 200). Só `definir-senha-inicial` tem single-use real, via
 * `password_setup_tokens.usedAt`. Este spec não força setup admin pesado: cobre
 * as validações de `definir-senha-inicial` que não exigem um token válido.
 *
 * Pré-requisitos (injetados pelo playwright.config.ts):
 *   - E2E_TEST_AUTH=1   habilita /api/test/login-as
 *   - EMAIL_TEST_MODE=1 habilita /api/test/emails (store de emails em memória)
 */

// Payload anti-bot: `mountedAt` no passado (> 1.5s de dwell) e sem honeypot.
// (features/auth/api/anti-bot.ts exige isso nas rotas públicas de auth.)
function antiBotFields() {
  return { website: "", mountedAt: Date.now() - 5_000 };
}

/** Registra um usuário novo (fica NÃO verificado) e devolve email/senha, ou null se o cadastro não for permitido. */
async function registrarUsuarioNover(
  request: APIRequestContext
): Promise<{ email: string; password: string } | null> {
  const email = uniqueEmail("auth-links");
  const password = "Xc0nstru! Forte#2026"; // forte o bastante p/ a política
  const res = await request.post("/api/auth/register", {
    data: {
      name: "E2E AuthLinks",
      email,
      username: uniqueUsername("authlinks"),
      password,
      role: "contratante",
      phone: "11999990000",
      acceptTerms: true,
      ...antiBotFields(),
    },
  });
  // register pode responder 403 se o perfil não estiver habilitado (isPerfilHabilitado),
  // ou 409 se colidir. Em qualquer caso que não seja 200/201, sinalizamos indisponível.
  if (![200, 201].includes(res.status())) return null;
  return { email, password };
}

/** Faz polling por um email de um `kind` específico e retorna a URL apontada por `urlField`. */
async function waitForEmailUrl(
  request: APIRequestContext,
  to: string,
  kind: string,
  urlField: string,
  { timeoutMs = 8000, intervalMs = 250 }: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<string | null> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const emails: CapturedEmail[] = await fetchCapturedEmails(request, to);
    const hit = emails.find(
      (e) => e.meta?.kind === kind && typeof (e.meta as Record<string, unknown>)?.[urlField] === "string"
    );
    if (hit) return (hit.meta as Record<string, unknown>)[urlField] as string;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

function tokenFrom(url: string): string | null {
  try {
    return new URL(url).searchParams.get("token");
  } catch {
    return null;
  }
}

test.describe("Integração — G1: auth-links / tokens", () => {
  test.beforeEach(async ({ request }) => {
    await clearCapturedEmails(request);
  });

  // ---- verify-email (GET, sempre redirect 302) -----------------------------

  test("verify-email sem token → redirect com error=token_missing (não 500)", async ({ request }) => {
    const res = await request.get("/api/auth/verify-email", { maxRedirects: 0 });
    expect(res.status(), "deve redirecionar (3xx), nunca 500").toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
    expect(res.headers()["location"] ?? "").toContain("error=token_missing");
  });

  test("verify-email com token adulterado → redirect com error=token_invalid", async ({ request }) => {
    const res = await request.get("/api/auth/verify-email?token=nao-e-um-jwt-valido", { maxRedirects: 0 });
    expect(res.status()).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
    expect(res.headers()["location"] ?? "").toContain("error=token_invalid");
  });

  test("verify-email com token válido → success=verified; reuso → already_verified", async ({ request }) => {
    const user = await registrarUsuarioNover(request);
    test.skip(!user, "cadastro de contratante indisponível neste ambiente — pulei o fluxo feliz de verify-email");

    // O register já dispara o email de verificação; se não, força um resend.
    let verifyUrl = await waitForEmailUrl(request, user!.email, "verification", "verificationUrl", { timeoutMs: 4000 });
    if (!verifyUrl) {
      const resend = await request.post("/api/auth/resend-verification", { data: { email: user!.email } });
      expect(resend.ok()).toBeTruthy();
      verifyUrl = await waitForEmailUrl(request, user!.email, "verification", "verificationUrl");
    }
    expect(verifyUrl, "email de verificação deve ter chegado").toBeTruthy();
    expect(verifyUrl!).toContain("/api/auth/verify-email?token=");

    const token = tokenFrom(verifyUrl!);
    expect(token, "token deve ser extraível do link").toBeTruthy();

    // 1ª visita: verifica.
    const first = await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token!)}`, { maxRedirects: 0 });
    expect(first.status()).toBeGreaterThanOrEqual(300);
    expect(first.status()).toBeLessThan(400);
    expect(first.headers()["location"] ?? "").toContain("success=verified");

    // 2ª visita com o MESMO token (stateless): já verificado, não é erro.
    const second = await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token!)}`, { maxRedirects: 0 });
    expect(second.headers()["location"] ?? "").toContain("success=already_verified");
  });

  // ---- resend-verification --------------------------------------------------

  test("resend-verification com email inexistente → {success:true} (anti-enumeração)", async ({ request }) => {
    const res = await request.post("/api/auth/resend-verification", {
      data: { email: uniqueEmail("inexistente-resend") },
    });
    expect(res.ok(), `esperado 2xx, veio ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("resend-verification sem email → 400 (não 500)", async ({ request }) => {
    const res = await request.post("/api/auth/resend-verification", { data: {} });
    expect(res.status()).toBe(400);
  });

  // ---- forgot-password ------------------------------------------------------

  test("forgot-password com email inexistente → {success:true} (não revela existência)", async ({ request }) => {
    const res = await request.post("/api/auth/forgot-password", {
      data: { email: uniqueEmail("inexistente-forgot"), ...antiBotFields() },
    });
    expect(res.ok(), `esperado 2xx, veio ${res.status()}`).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  test("forgot-password com email inválido → 400 (não 500)", async ({ request }) => {
    const res = await request.post("/api/auth/forgot-password", {
      data: { email: "isto-nao-e-email", ...antiBotFields() },
    });
    expect(res.status()).toBe(400);
  });

  // ---- reset-password (POST, token no body) --------------------------------

  test("reset-password com senha curta (<8) → 400", async ({ request }) => {
    const res = await request.post("/api/auth/reset-password", {
      data: { token: "qualquer-coisa", newPassword: "curta" },
    });
    expect(res.status()).toBe(400);
  });

  test("reset-password com token inválido → 400 (não 500)", async ({ request }) => {
    const res = await request.post("/api/auth/reset-password", {
      data: { token: "token-que-nao-e-jwt", newPassword: "SenhaLongaOk#2026" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(String(body.message ?? "")).toContain("Token");
  });

  test("forgot → reset: fluxo feliz redefine a senha (token do link) → 200", async ({ request }) => {
    const user = await registrarUsuarioNover(request);
    test.skip(!user, "cadastro indisponível neste ambiente — pulei o fluxo feliz de reset-password");

    await clearCapturedEmails(request);
    const forgot = await request.post("/api/auth/forgot-password", {
      data: { email: user!.email, ...antiBotFields() },
    });
    expect(forgot.ok()).toBeTruthy();

    const resetUrl = await waitForEmailUrl(request, user!.email, "password-reset", "resetUrl");
    expect(resetUrl, "email de reset deve ter chegado").toBeTruthy();
    const token = tokenFrom(resetUrl!);
    expect(token).toBeTruthy();

    const novaSenha = "N0vaSenha!Forte#2026";
    const reset = await request.post("/api/auth/reset-password", {
      data: { token: token!, newPassword: novaSenha },
    });
    expect(reset.status(), `reset deveria dar 200; corpo: ${await reset.text()}`).toBe(200);
    const body = await reset.json();
    expect(body.success).toBe(true);
  });

  // ---- definir-senha-inicial (validações; single-use real) -----------------

  test("definir-senha-inicial com senhas divergentes → 400", async ({ request }) => {
    const res = await request.post("/api/auth/definir-senha-inicial", {
      data: { token: "algum-token", password: "SenhaLonga#2026", confirmPassword: "OutraCoisa#2026" },
    });
    expect(res.status()).toBe(400);
  });

  test("definir-senha-inicial com token inválido → 400 (não 500)", async ({ request }) => {
    const senha = "SenhaLongaValida#2026";
    const res = await request.post("/api/auth/definir-senha-inicial", {
      data: { token: "token-inexistente", password: senha, confirmPassword: senha },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(String(body.message ?? "")).toMatch(/inválido|expirado/i);
  });

  test("definir-senha-inicial com payload incompleto → 400 (schema)", async ({ request }) => {
    const res = await request.post("/api/auth/definir-senha-inicial", { data: { token: "x" } });
    expect(res.status()).toBe(400);
  });
});
