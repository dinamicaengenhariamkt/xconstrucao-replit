import { test, expect, type APIRequestContext } from "@playwright/test";
import { generateSync } from "otplib";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import {
  loginAs,
  logout,
  uniqueEmail,
  uniqueUsername,
  fetchCapturedEmails,
  clearCapturedEmails,
  type CapturedEmail,
} from "../helpers";

/**
 * Integração (J36) — G?: auth sensível (2FA login-verify + troca de email).
 *
 * Endpoints:
 *   - POST /api/auth/2fa/verificar          (2º passo do login com 2FA ativo — J22)
 *   - POST /api/auth/trocar-email            (self-service; dispara link ao NOVO email)
 *   - GET  /api/auth/confirmar-novo-email    (consome o link, aplica users.email)
 *
 * Descobertas técnicas:
 *   - `login-as` (test-only) NUNCA passa pelo fluxo de senha, então não gera o
 *     `challengeToken` de 2FA (esse token só nasce em POST /api/auth/login quando
 *     a conta tem TOTP ativo — ver features/auth/api/auth-service.ts). Para exercitar
 *     o caminho feliz de /2fa/verificar é preciso: registrar um usuário, verificar o
 *     email, logar (login-as) para ativar 2FA via /api/auth/2fa/{setup,confirmar}
 *     (mesmo ciclo do G2 — auth-conta.integration.spec.ts), fazer LOGOUT e então um
 *     login REAL com senha (que devolve o challengeToken), e só aí chamar
 *     /2fa/verificar com um TOTP gerado a partir do secret capturado no setup.
 *   - challengeToken é um JWT HMAC próprio (`createTwoFactorChallengeToken`), 5 min
 *     de vida, tipo "2fa-challenge" — não dá pra forjar sem o segredo do servidor,
 *     então os guards de token ausente/inválido/expirado são cobertos batendo com
 *     strings arbitrárias (sempre inválidas) em vez de mockar o servidor.
 *   - trocar-email usa requireVerifiedUser (401 sem sessão, 403 se impersonando) +
 *     Zod (novoEmail, currentPassword) + confirma senha atual (comparePassword) +
 *     bloqueia email igual ao atual (400) e email em uso por outra conta (409). No
 *     caminho feliz NÃO troca o email ainda — só dispara o email de confirmação
 *     (kind="verification", já que reaproveita createEmailVerificationToken) com a
 *     URL para confirmar-novo-email.
 *   - confirmar-novo-email é GET público (o próprio token prova posse da caixa
 *     nova) e sempre redireciona (nunca JSON) — sucesso/erro viram query params em
 *     /verificar-email. Cobrimos: token ausente/inválido → redirect com `error=`;
 *     caminho feliz → redirect com `success=email_trocado` E o efeito real no
 *     banco (`users.email` atualizado); um segundo clique no MESMO link é
 *     idempotente (o email já bate, então some para o mesmo `success=`).
 *   - Isolamento: tudo roda sobre um usuário novo `@xconstrucao-e2e.test` criado
 *     neste spec (nunca toca o seed). Cleanup por email no `afterEach`.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; EMAIL_TEST_MODE=1.
 */

// Payload anti-bot: `mountedAt` no passado (> 1.5s de dwell) e sem honeypot.
function antiBotFields() {
  return { website: "", mountedAt: Date.now() - 5_000 };
}

const CPF_VALIDO = "52998224725";
const SENHA = "Xc0nstru! Forte#2026";

/** Faz polling por um email de um `kind` e retorna a URL apontada por `urlField`. */
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

/** Registra um usuário novo (fica NÃO verificado) e devolve email/senha, ou null se indisponível. */
async function registrarUsuario(request: APIRequestContext): Promise<{ email: string; password: string } | null> {
  const email = uniqueEmail("auth-mut");
  const res = await request.post("/api/auth/register", {
    data: {
      name: "E2E AuthMutacoes",
      email,
      username: uniqueUsername("authmut"),
      password: SENHA,
      role: "contratante",
      phone: "11999990000",
      cpfCnpj: CPF_VALIDO,
      acceptTerms: true,
      ...antiBotFields(),
    },
  });
  if (![200, 201].includes(res.status())) return null;
  return { email, password: SENHA };
}

/** Registra + verifica o email (via link capturado). Não loga. */
async function registrarEVerificar(request: APIRequestContext): Promise<{ email: string; password: string } | null> {
  await clearCapturedEmails(request);
  const user = await registrarUsuario(request);
  if (!user) return null;

  const verifyUrl = await waitForEmailUrl(request, user.email, "verification", "verificationUrl");
  if (!verifyUrl) return null;
  const token = tokenFrom(verifyUrl);
  if (!token) return null;

  const verify = await request.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
    maxRedirects: 0,
  });
  expect(verify.headers()["location"] ?? "", "verify-email deveria ter verificado").toContain("success=");
  return user;
}

/** Remove o usuário E2E criado neste spec (best-effort). */
async function limparUsuario(email: string | null | undefined): Promise<void> {
  if (!email) return;
  await db.delete(users).where(eq(users.email, email)).catch(() => {});
}

// ===========================================================================
// POST /api/auth/2fa/verificar
// ===========================================================================

test.describe("Integração — auth: 2fa/verificar", () => {
  test("challengeToken ausente → 401 CHALLENGE_EXPIRED", async ({ request }) => {
    const res = await request.post("/api/auth/2fa/verificar", { data: { codigo: "000000" } });
    expect(res.status(), "sem challengeToken deve barrar com 401").toBe(401);
    const body = await res.json();
    expect(body.error).toBe("CHALLENGE_EXPIRED");
  });

  test("challengeToken inválido/forjado → 401 CHALLENGE_EXPIRED", async ({ request }) => {
    const res = await request.post("/api/auth/2fa/verificar", {
      data: { challengeToken: "isto.nao.eh-um-jwt-valido", codigo: "123456" },
    });
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBe("CHALLENGE_EXPIRED");
  });

  test("fluxo feliz: login com 2FA ativo devolve challengeToken → TOTP correto emite sessão", async ({
    request,
  }) => {
    const user = await registrarEVerificar(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");

    try {
      // Ativa 2FA (ciclo setup→confirmar, mesmo padrão do G2) usando login-as
      // só para exercitar a ativação — o challengeToken real virá do login por senha.
      await loginAs(request, user!.email);
      const setup = await request.post("/api/auth/2fa/setup");
      expect(setup.status(), `setup deveria dar 200; corpo: ${await setup.text()}`).toBe(200);
      const secret: string = (await setup.json()).secret;
      const codigoConfirmar = generateSync({ secret });
      const conf = await request.post("/api/auth/2fa/confirmar", { data: { codigo: codigoConfirmar } });
      expect(conf.status(), `confirmar deveria dar 200; corpo: ${await conf.text()}`).toBe(200);
      await logout(request);

      // Login por senha (não login-as) → com 2FA ativo devolve challengeToken, SEM sessão.
      const login = await request.post("/api/auth/login", {
        data: { email: user!.email, password: user!.password, ...antiBotFields() },
      });
      expect(login.status(), `login deveria dar 200; corpo: ${await login.text()}`).toBe(200);
      const loginBody = await login.json();
      expect(loginBody.twoFactorRequired, "login com 2FA ativo não deve emitir sessão direto").toBe(true);
      expect(typeof loginBody.challengeToken).toBe("string");

      // Sessão ainda não emitida: uma rota autenticada deve barrar com 401.
      const meAntes = await request.get("/api/auth/me");
      expect(meAntes.status(), "sem sessão emitida, /me deve dar 401").toBe(401);

      // Código TOTP errado → 401 GENÉRICO (não revela motivo).
      const verificarErrado = await request.post("/api/auth/2fa/verificar", {
        data: { challengeToken: loginBody.challengeToken, codigo: "000000" },
      });
      expect(verificarErrado.status(), "código TOTP incorreto → 401").toBe(401);

      // Código TOTP correto → 200, emite sessão de verdade.
      const codigoLogin = generateSync({ secret });
      const verificar = await request.post("/api/auth/2fa/verificar", {
        data: { challengeToken: loginBody.challengeToken, codigo: codigoLogin },
      });
      expect(verificar.status(), `2fa/verificar feliz → 200; corpo: ${await verificar.text()}`).toBe(200);
      const verificarBody = await verificar.json();
      expect(verificarBody.success).toBe(true);
      expect(verificarBody.user?.email).toBe(user!.email);

      // Efeito real: a resposta emite os cookies de sessão (access+refresh). Os
      // cookies são `secure: true` (produção), e o request context do Playwright
      // roda sobre HTTP puro em 127.0.0.1 — por isso não são reaproveitados
      // automaticamente pelo cookie-jar do teste (mesma semântica de um browser
      // real recusando Secure em origem não-TLS). Confirmamos o Set-Cookie bruto
      // em vez de depender do jar para provar que a sessão foi de fato emitida.
      const setCookie = verificar.headersArray().filter((h) => h.name.toLowerCase() === "set-cookie");
      expect(
        setCookie.some((h) => h.value.startsWith("access_token=")),
        "resposta deve emitir cookie access_token"
      ).toBeTruthy();
      expect(
        setCookie.some((h) => h.value.startsWith("refresh_token=")),
        "resposta deve emitir cookie refresh_token"
      ).toBeTruthy();

      // (a sessão emitida pelo /2fa/verificar não fica no cookie-jar do teste —
      // ver nota acima — então não há como desativar 2FA autenticado aqui; o
      // `finally` remove o usuário inteiro, o que já limpa `user_totp` por cascade.)
      await logout(request);
    } finally {
      await limparUsuario(user?.email);
    }
  });
});

// ===========================================================================
// POST /api/auth/trocar-email + GET /api/auth/confirmar-novo-email
// ===========================================================================

test.describe("Integração — auth: trocar-email", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/auth/trocar-email", {
      data: { novoEmail: uniqueEmail("nao-logado"), currentPassword: "qualquer1" },
    });
    expect(res.status()).toBe(401);
  });

  test("payload inválido (novoEmail malformado) → 400", async ({ request }) => {
    const user = await registrarEVerificar(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    try {
      await loginAs(request, user!.email);
      const res = await request.post("/api/auth/trocar-email", {
        data: { novoEmail: "nao-e-email", currentPassword: user!.password },
      });
      expect(res.status()).toBe(400);
      await logout(request);
    } finally {
      await limparUsuario(user?.email);
    }
  });

  test("senha atual incorreta → 401", async ({ request }) => {
    const user = await registrarEVerificar(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    try {
      await loginAs(request, user!.email);
      const res = await request.post("/api/auth/trocar-email", {
        data: { novoEmail: uniqueEmail("novo"), currentPassword: "senha-errada-123" },
      });
      expect(res.status()).toBe(401);
      const body = await res.json();
      expect(String(body.message ?? "")).toContain("Senha incorreta");
      await logout(request);
    } finally {
      await limparUsuario(user?.email);
    }
  });

  test("novo email igual ao atual → 400", async ({ request }) => {
    const user = await registrarEVerificar(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    try {
      await loginAs(request, user!.email);
      const res = await request.post("/api/auth/trocar-email", {
        data: { novoEmail: user!.email, currentPassword: user!.password },
      });
      expect(res.status()).toBe(400);
      await logout(request);
    } finally {
      await limparUsuario(user?.email);
    }
  });

  test("novo email já em uso por outra conta → 409", async ({ request }) => {
    const user = await registrarEVerificar(request);
    const outro = await registrarEVerificar(request);
    test.skip(!user || !outro, "cadastro/verificação indisponível neste ambiente");
    try {
      await loginAs(request, user!.email);
      const res = await request.post("/api/auth/trocar-email", {
        data: { novoEmail: outro!.email, currentPassword: user!.password },
      });
      expect(res.status()).toBe(409);
      await logout(request);
    } finally {
      await limparUsuario(user?.email);
      await limparUsuario(outro?.email);
    }
  });

  test("fluxo feliz: solicita a troca → email não muda ainda → confirmar-novo-email aplica no banco", async ({
    request,
  }) => {
    const user = await registrarEVerificar(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    const novoEmail = uniqueEmail("trocado");
    try {
      await loginAs(request, user!.email);
      await clearCapturedEmails(request);

      const solicitar = await request.post("/api/auth/trocar-email", {
        data: { novoEmail, currentPassword: user!.password },
      });
      expect(solicitar.status(), `esperado 200; corpo: ${await solicitar.text()}`).toBe(200);
      expect((await solicitar.json()).success).toBe(true);

      // Email NÃO muda ainda — só o link chegou.
      const [antesConfirmar] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.email, user!.email))
        .limit(1);
      expect(antesConfirmar?.email, "email não deve mudar antes da confirmação").toBe(user!.email);

      const verifyUrl = await waitForEmailUrl(request, novoEmail, "verification", "verificationUrl");
      expect(verifyUrl, "link de confirmação deve ter chegado ao NOVO email").toBeTruthy();
      const token = tokenFrom(verifyUrl!);
      expect(token, "token deve ser extraível da URL").toBeTruthy();
      await logout(request);

      // GET público — sempre redireciona (nunca JSON).
      const confirmar = await request.get(`/api/auth/confirmar-novo-email?token=${encodeURIComponent(token!)}`, {
        maxRedirects: 0,
      });
      expect([301, 302, 303, 307, 308]).toContain(confirmar.status());
      expect(confirmar.headers()["location"] ?? "").toContain("success=email_trocado");

      // Efeito real no banco: users.email atualizado para o NOVO endereço.
      const [depois] = await db.select({ email: users.email }).from(users).where(eq(users.email, novoEmail)).limit(1);
      expect(depois?.email, "email deve ter sido trocado no banco").toBe(novoEmail);

      // Segundo clique no MESMO link → idempotente (já bate) → mesmo success=.
      const confirmarDeNovo = await request.get(
        `/api/auth/confirmar-novo-email?token=${encodeURIComponent(token!)}`,
        { maxRedirects: 0 }
      );
      expect(confirmarDeNovo.headers()["location"] ?? "").toContain("success=email_trocado");
    } finally {
      await limparUsuario(user?.email);
      await limparUsuario(novoEmail);
    }
  });

  test("token ausente → redirect com error=token_missing", async ({ request }) => {
    const res = await request.get("/api/auth/confirmar-novo-email", { maxRedirects: 0 });
    expect([301, 302, 303, 307, 308]).toContain(res.status());
    expect(res.headers()["location"] ?? "").toContain("error=token_missing");
  });

  test("token inválido/forjado → redirect com error=token_invalid", async ({ request }) => {
    const res = await request.get("/api/auth/confirmar-novo-email?token=token-forjado-invalido", {
      maxRedirects: 0,
    });
    expect([301, 302, 303, 307, 308]).toContain(res.status());
    expect(res.headers()["location"] ?? "").toContain("error=token_invalid");
  });
});
