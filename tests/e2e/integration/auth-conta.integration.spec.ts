import { test, expect, type APIRequestContext } from "@playwright/test";
import { generateSync } from "otplib";
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
 * Integração (J36) — G2: auth-conta & 2FA.
 *
 * Cobre a gestão da própria conta autenticada, que até aqui não tinha cobertura
 * de integração. Endpoints:
 *   - POST /api/auth/change-password           (troca de senha com senha atual)
 *   - POST /api/auth/change-password-forced     (troca sob mustChangePassword)
 *   - POST /api/auth/2fa/{setup,confirmar,status,desativar}   (ciclo TOTP J22)
 *   - POST /api/auth/register                   (cadastro público)
 *   - POST /api/auth/refresh                     (rotação de sessão)
 *   - POST /api/auth/desativar-conta             (soft-delete self-service)
 *   - GET  /api/auth/exportar-dados              (portabilidade LGPD)
 *
 * Descobertas técnicas (ver J36 §10):
 *   - Não há helper de login em helpers.ts: cada spec faz `login-as` local
 *     (mesmo padrão de auth-authz/auth-links). `login-as` só neutraliza
 *     `mustChangePassword`; NÃO neutraliza emailVerified/ativo — por isso os
 *     fluxos felizes usam um usuário recém-registrado E verificado (via email).
 *   - 2FA usa otplib v13; `generateSync({ secret })` gera um TOTP válido a partir
 *     do `secret` que /2fa/setup retorna em claro → dá pra testar o ciclo inteiro.
 *   - Rotas públicas (register/login) passam por validateAntiBot → mandar
 *     `mountedAt` no passado (>1.5s) e sem honeypot `website`.
 *   - Isolamento: register grava em `users` (soft-delete idem). Só usamos contas
 *     `@xconstrucao-e2e.test` (lixo "E2E") ou seed em rotas read-only (export).
 *
 * Pré-requisitos (injetados pelo playwright.config.ts):
 *   - E2E_TEST_AUTH=1   habilita /api/test/login-as
 *   - EMAIL_TEST_MODE=1 habilita /api/test/emails
 */

// ---- helpers ---------------------------------------------------------------

// Payload anti-bot: `mountedAt` no passado (> 1.5s de dwell) e sem honeypot.
function antiBotFields() {
  return { website: "", mountedAt: Date.now() - 5_000 };
}

// CPF válido (dígito verificador correto) — obrigatório para contratante/empreiteiro
// desde que `registerSchema` passou a exigir cpfCnpj para essas roles (ASAAS).
const CPF_VALIDO = "52998224725";

/** Registra um usuário novo (fica NÃO verificado) e devolve email/senha, ou null se indisponível. */
async function registrarUsuario(
  request: APIRequestContext
): Promise<{ email: string; password: string } | null> {
  const email = uniqueEmail("auth-conta");
  const password = "Xc0nstru! Forte#2026";
  const res = await request.post("/api/auth/register", {
    data: {
      name: "E2E AuthConta",
      email,
      username: uniqueUsername("authconta"),
      password,
      role: "contratante",
      phone: "11999990000",
      cpfCnpj: CPF_VALIDO,
      acceptTerms: true,
      ...antiBotFields(),
    },
  });
  if (![200, 201].includes(res.status())) return null;
  return { email, password };
}

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

/**
 * Registra um usuário, verifica o email (via link capturado) e loga via login-as.
 * Devolve { email, password } de um usuário AUTENTICADO e verificado, pronto para
 * exercitar as rotas que exigem requireVerifiedUser. Retorna null se o cadastro
 * estiver desabilitado no ambiente.
 */
async function usuarioVerificadoLogado(
  request: APIRequestContext
): Promise<{ email: string; password: string } | null> {
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
  // sucesso → redirect com success=verified
  expect(verify.headers()["location"] ?? "", "verify-email deveria ter verificado").toContain("success=");

  await loginAs(request, user.email);
  return user;
}

// ===========================================================================
// change-password
// ===========================================================================

test.describe("Integração — G2: change-password", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/auth/change-password", {
      data: { currentPassword: "qualquer1", newPassword: "OutraSenha#2026", confirmPassword: "OutraSenha#2026" },
    });
    expect(res.status()).toBe(401);
  });

  test("confirmação divergente → 400", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    const res = await request.post("/api/auth/change-password", {
      data: { currentPassword: user!.password, newPassword: "NovaSenha#2026", confirmPassword: "Diverge#2026" },
    });
    expect(res.status()).toBe(400);
  });

  test("nova senha igual à atual → 400", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    const res = await request.post("/api/auth/change-password", {
      data: { currentPassword: user!.password, newPassword: user!.password, confirmPassword: user!.password },
    });
    expect(res.status()).toBe(400);
  });

  test("senha atual incorreta → 401", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    const res = await request.post("/api/auth/change-password", {
      data: { currentPassword: "senha-errada-123", newPassword: "NovaSenha#2026", confirmPassword: "NovaSenha#2026" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(String(body.message ?? "")).toContain("Senha atual incorreta");
  });

  test("nova senha fraca → 400", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    const res = await request.post("/api/auth/change-password", {
      data: { currentPassword: user!.password, newPassword: "12345678", confirmPassword: "12345678" },
    });
    expect(res.status()).toBe(400);
  });

  test("fluxo feliz: troca a senha e o efeito persiste (login com nova ok, antiga falha)", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");

    const novaSenha = "N0vaSenhaForte#2026";
    const res = await request.post("/api/auth/change-password", {
      data: { currentPassword: user!.password, newPassword: novaSenha, confirmPassword: novaSenha },
    });
    expect(res.status(), `esperado 200; corpo: ${await res.text()}`).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Efeito real no banco: login com a senha ANTIGA falha (401)...
    const loginAntigo = await request.post("/api/auth/login", {
      data: { email: user!.email, password: user!.password, ...antiBotFields() },
    });
    expect(loginAntigo.status(), "login com senha antiga deve falhar").toBe(401);

    // ...e com a senha NOVA passa (200: sessão emitida ou 2FA — aqui sem 2FA → sessão).
    const loginNovo = await request.post("/api/auth/login", {
      data: { email: user!.email, password: novaSenha, ...antiBotFields() },
    });
    expect(loginNovo.status(), `login com senha nova deve dar 200; corpo: ${await loginNovo.text()}`).toBe(200);
  });
});

// ===========================================================================
// change-password-forced (só o guard de pré-condição; fluxo feliz depende do G4)
// ===========================================================================

test.describe("Integração — G2: change-password-forced", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/auth/change-password-forced", {
      data: { newPassword: "NovaSenha#2026", confirmPassword: "NovaSenha#2026" },
    });
    expect(res.status()).toBe(401);
  });

  test("conta que NÃO exige troca → 400 (pré-condição mustChangePassword)", async ({ request }) => {
    // login-as neutraliza mustChangePassword, então o usuário logado nunca tem a flag:
    // a rota deve responder 400 "não exige troca de senha", nunca 200.
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    const nova = "NovaSenhaForcada#2026";
    const res = await request.post("/api/auth/change-password-forced", {
      data: { newPassword: nova, confirmPassword: nova },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(String(body.message ?? "")).toContain("não exige troca de senha");
  });

  test("payload incompleto → 400 (schema)", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    const res = await request.post("/api/auth/change-password-forced", { data: { newPassword: "x" } });
    expect(res.status()).toBe(400);
  });
});

// ===========================================================================
// 2FA — ciclo completo (setup → confirmar → status → desativar)
// ===========================================================================

test.describe.serial("Integração — G2: 2FA (ciclo TOTP)", () => {
  test("authz: 2fa/status sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/auth/2fa/status");
    expect(res.status()).toBe(401);
  });

  test("ciclo: status→setup→confirmar→status→setup(409)→desativar→status", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");

    // status inicial: desativado, disponível (conta tem senha).
    const s0 = await request.get("/api/auth/2fa/status");
    expect(s0.status()).toBe(200);
    const s0body = await s0.json();
    expect(s0body.enabled).toBe(false);
    expect(s0body.disponivel).toBe(true);

    // setup: gera secret pendente.
    const setup = await request.post("/api/auth/2fa/setup");
    expect(setup.status(), `setup deveria dar 200; corpo: ${await setup.text()}`).toBe(200);
    const setupBody = await setup.json();
    expect(typeof setupBody.secret).toBe("string");
    expect(typeof setupBody.otpauthUri).toBe("string");
    const secret: string = setupBody.secret;

    // confirmar com código inválido → 400 INVALID_CODE.
    const confBad = await request.post("/api/auth/2fa/confirmar", { data: { codigo: "000000" } });
    expect(confBad.status()).toBe(400);
    expect((await confBad.json()).error).toBe("INVALID_CODE");

    // confirmar com código TOTP válido gerado a partir do secret → 200 + recoveryCodes.
    const codigo = generateSync({ secret });
    const conf = await request.post("/api/auth/2fa/confirmar", { data: { codigo } });
    expect(conf.status(), `confirmar deveria dar 200; corpo: ${await conf.text()}`).toBe(200);
    const confBody = await conf.json();
    expect(confBody.success).toBe(true);
    expect(Array.isArray(confBody.recoveryCodes)).toBe(true);
    expect(confBody.recoveryCodes.length).toBeGreaterThan(0);

    // status agora: ativado.
    const s1 = await request.get("/api/auth/2fa/status");
    expect((await s1.json()).enabled).toBe(true);

    // setup de novo com 2FA ativo → 409 ALREADY_ENABLED.
    const setup2 = await request.post("/api/auth/2fa/setup");
    expect(setup2.status()).toBe(409);
    expect((await setup2.json()).error).toBe("ALREADY_ENABLED");

    // desativar: senha errada → 401.
    const codigoDesativar = generateSync({ secret });
    const desSenhaErrada = await request.post("/api/auth/2fa/desativar", {
      data: { senha: "senha-errada", codigo: codigoDesativar },
    });
    expect(desSenhaErrada.status()).toBe(401);

    // desativar: código errado → 400.
    const desCodigoErrado = await request.post("/api/auth/2fa/desativar", {
      data: { senha: user!.password, codigo: "000000" },
    });
    expect(desCodigoErrado.status()).toBe(400);

    // desativar: senha + TOTP corrente → 200. (regenera o código: pode ter passado a janela)
    const codigoOk = generateSync({ secret });
    const des = await request.post("/api/auth/2fa/desativar", {
      data: { senha: user!.password, codigo: codigoOk },
    });
    expect(des.status(), `desativar deveria dar 200; corpo: ${await des.text()}`).toBe(200);
    expect((await des.json()).success).toBe(true);

    // status final: desativado.
    const s2 = await request.get("/api/auth/2fa/status");
    expect((await s2.json()).enabled).toBe(false);
  });
});

// ===========================================================================
// register
// ===========================================================================

test.describe("Integração — G2: register", () => {
  test("email malformado → 400", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        name: "E2E Reg",
        email: "isto-nao-e-email",
        username: uniqueUsername("reg"),
        password: "Xc0nstru! Forte#2026",
        role: "contratante",
        cpfCnpj: CPF_VALIDO,
        acceptTerms: true,
        ...antiBotFields(),
      },
    });
    expect(res.status()).toBe(400);
  });

  test("senha curta → 400", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        name: "E2E Reg",
        email: uniqueEmail("reg-fraca"),
        username: uniqueUsername("reg"),
        password: "curta",
        role: "contratante",
        cpfCnpj: CPF_VALIDO,
        acceptTerms: true,
        ...antiBotFields(),
      },
    });
    expect(res.status()).toBe(400);
  });

  test("email duplicado → 409", async ({ request }) => {
    const first = await registrarUsuario(request);
    test.skip(!first, "cadastro indisponível neste ambiente");

    const dup = await request.post("/api/auth/register", {
      data: {
        name: "E2E Reg Dup",
        email: first!.email, // mesmo email
        username: uniqueUsername("regdup"),
        password: "Xc0nstru! Forte#2026",
        role: "contratante",
        cpfCnpj: CPF_VALIDO,
        acceptTerms: true,
        ...antiBotFields(),
      },
    });
    expect(dup.status()).toBe(409);
  });

  test("fluxo feliz → 201 e dispara email de verificação", async ({ request }) => {
    await clearCapturedEmails(request);
    const email = uniqueEmail("reg-ok");
    const res = await request.post("/api/auth/register", {
      data: {
        name: "E2E Reg Ok",
        email,
        username: uniqueUsername("regok"),
        password: "Xc0nstru! Forte#2026",
        role: "contratante",
        phone: "11999990000",
        cpfCnpj: CPF_VALIDO,
        acceptTerms: true,
        ...antiBotFields(),
      },
    });
    test.skip(![200, 201].includes(res.status()), "cadastro de contratante desabilitado neste ambiente");
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.email).toBe(email);

    const verifyUrl = await waitForEmailUrl(request, email, "verification", "verificationUrl");
    expect(verifyUrl, "email de verificação deve ter chegado").toBeTruthy();
  });

  // ---- cpfCnpj: obrigatório p/ contratante e empreiteiro, isento p/ anunciante ----

  test("contratante SEM cpfCnpj → 400", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        name: "E2E Reg Sem CPF",
        email: uniqueEmail("reg-sem-cpf"),
        username: uniqueUsername("regsemcpf"),
        password: "Xc0nstru! Forte#2026",
        role: "contratante",
        phone: "11999990000",
        acceptTerms: true,
        ...antiBotFields(),
        // cpfCnpj propositalmente omitido
      },
    });
    expect(res.status(), `esperado 400; corpo: ${await res.text()}`).toBe(400);
  });

  test("empreiteiro SEM cpfCnpj → 400", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        name: "E2E Reg Emp Sem CPF",
        email: uniqueEmail("reg-emp-sem-cpf"),
        username: uniqueUsername("regempsemcpf"),
        password: "Xc0nstru! Forte#2026",
        role: "empreiteiro",
        phone: "11999990000",
        acceptTerms: true,
        ...antiBotFields(),
        // cpfCnpj propositalmente omitido
      },
    });
    expect(res.status(), `esperado 400; corpo: ${await res.text()}`).toBe(400);
  });

  test("cpfCnpj com dígito verificador inválido → 400", async ({ request }) => {
    const res = await request.post("/api/auth/register", {
      data: {
        name: "E2E Reg CPF Invalido",
        email: uniqueEmail("reg-cpf-invalido"),
        username: uniqueUsername("regcpfinvalido"),
        password: "Xc0nstru! Forte#2026",
        role: "contratante",
        phone: "11999990000",
        cpfCnpj: "12345678900", // 11 dígitos, DV incorreto
        acceptTerms: true,
        ...antiBotFields(),
      },
    });
    expect(res.status(), `esperado 400; corpo: ${await res.text()}`).toBe(400);
  });

  test("anunciante SEM cpfCnpj → segue funcionando (isento)", async ({ request }) => {
    await clearCapturedEmails(request);
    const email = uniqueEmail("reg-anunciante");
    const res = await request.post("/api/auth/register", {
      data: {
        name: "E2E Reg Anunciante",
        email,
        username: uniqueUsername("reganunciante"),
        password: "Xc0nstru! Forte#2026",
        role: "anunciante",
        phone: "11999990000",
        acceptTerms: true,
        ...antiBotFields(),
        // cpfCnpj propositalmente omitido — anunciante é isento
      },
    });
    test.skip(![200, 201].includes(res.status()), "cadastro de anunciante desabilitado neste ambiente");
    expect(res.status(), `esperado 201; corpo: ${await res.text()}`).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.email).toBe(email);
  });
});

// ===========================================================================
// refresh
// ===========================================================================

test.describe("Integração — G2: refresh", () => {
  test("sem cookie de refresh → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/auth/refresh");
    expect(res.status()).toBe(401);
  });

  test("após login-as (sessão persistida) → 200 com user", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    const res = await request.post("/api/auth/refresh");
    expect(res.status(), `refresh deveria dar 200; corpo: ${await res.text()}`).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user?.email).toBe(user!.email);
  });
});

// ===========================================================================
// desativar-conta
// ===========================================================================

test.describe("Integração — G2: desativar-conta", () => {
  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post("/api/auth/desativar-conta", { data: { currentPassword: "x" } });
    expect(res.status()).toBe(401);
  });

  test("senha incorreta → 401", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");
    const res = await request.post("/api/auth/desativar-conta", {
      data: { currentPassword: "senha-errada-123" },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(String(body.message ?? "")).toContain("Senha incorreta");
  });

  test("fluxo feliz: desativa (soft-delete) e a conta passa a ser barrada no login", async ({ request }) => {
    const user = await usuarioVerificadoLogado(request);
    test.skip(!user, "cadastro/verificação indisponível neste ambiente");

    const res = await request.post("/api/auth/desativar-conta", {
      data: { currentPassword: user!.password },
    });
    expect(res.status(), `esperado 200; corpo: ${await res.text()}`).toBe(200);
    expect((await res.json()).success).toBe(true);

    // Efeito real: users.ativo=false → login normal barra com 403 ACCOUNT_DISABLED.
    const login = await request.post("/api/auth/login", {
      data: { email: user!.email, password: user!.password, ...antiBotFields() },
    });
    expect(login.status(), "conta desativada não deve logar").toBe(403);
    const body = await login.json();
    expect(body.error).toBe("ACCOUNT_DISABLED");
  });
});

// ===========================================================================
// exportar-dados (LGPD — read-only, pode usar seed)
// ===========================================================================

test.describe("Integração — G2: exportar-dados", () => {
  const SEED_CONTRATANTE = "joao@construtora.com";

  test("sem sessão → 401", async ({ request }) => {
    await logout(request);
    const res = await request.get("/api/auth/exportar-dados");
    expect(res.status()).toBe(401);
  });

  test("fluxo feliz: 200 como download JSON com o shape esperado", async ({ request }) => {
    await loginAs(request, SEED_CONTRATANTE);
    const res = await request.get("/api/auth/exportar-dados");
    // Se o seed não tiver o contratante, o login-as falha antes; aqui checamos o 200.
    expect(res.status(), `esperado 200; corpo: ${await res.text()}`).toBe(200);
    expect(res.headers()["content-type"] ?? "").toContain("application/json");
    expect(res.headers()["content-disposition"] ?? "").toContain("attachment");

    const body = await res.json();
    expect(body.titular?.email).toBe(SEED_CONTRATANTE);
    expect(body).toHaveProperty("conta");
    expect(body).toHaveProperty("obrasContratante");
    // não vaza hash de senha
    expect((body.conta ?? {})).not.toHaveProperty("password");
  });
});
