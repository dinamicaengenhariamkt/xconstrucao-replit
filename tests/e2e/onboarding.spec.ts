import { test, expect } from "@playwright/test";
import {
  clearCapturedEmails,
  uniqueEmail,
  uniqueUsername,
  waitForVerificationEmail,
} from "./helpers";

/**
 * Jornada 01 — Identidade & Onboarding.
 * Pré-requisitos (env injetado pelo playwright.config.ts):
 *   - EMAIL_TEST_MODE=1   Brevo mockado; emails ficam em memória
 *   - E2E_TEST_AUTH=1     habilita /api/test/oauth-simulate e /api/test/login-as
 */

test.beforeAll(async ({ request }) => {
  // Aquecimento: força o Turbopack a compilar rotas críticas antes do
  // timeout do primeiro teste começar a contar.
  for (const path of ["/cadastro", "/login", "/verificar-email", "/api/test/emails"]) {
    await request.get(path).catch(() => {});
  }
});

test.beforeEach(async ({ request }) => {
  await clearCapturedEmails(request);
});

test.describe("Jornada 01 — Cadastro & Onboarding", () => {
  test("contratante: cadastro -> verificar email -> entra no dashboard", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("contratante");
    const username = uniqueUsername("contratante");
    const password = "Senha@123";

    await page.goto("/cadastro?perfil=contratante");
    await expect(page.getByTestId("text-perfil-badge")).toHaveText("Contratante");

    await page.getByTestId("input-name").fill("Contratante E2E");
    await page.getByTestId("input-email").fill(email);
    await page.getByTestId("input-username").fill(username);
    await page.getByTestId("input-phone").fill("11999990000");
    await page.getByTestId("input-cpfcnpj").fill("52998224725");
    await page.getByTestId("input-password").fill(password);
    await page.getByTestId("checkbox-terms").click();

    await Promise.all([
      page.waitForURL(/\/verificar-email/),
      page.getByTestId("button-register").click(),
    ]);
    await expect(page).toHaveURL(/\/verificar-email\?email=/);

    const verification = await waitForVerificationEmail(request, email);
    const verificationUrl = verification.meta?.verificationUrl as string;
    expect(verificationUrl).toContain("/api/auth/verify-email?token=");

    // Reescreve o host para o baseURL do teste (email pode usar host de prod).
    const verifyParsed = new URL(verificationUrl);
    await page.goto(`${verifyParsed.pathname}${verifyParsed.search}`);
    await expect(page).toHaveURL(/\/verificar-email\?success=verified/);

    await page.goto("/login?perfil=contratante");
    await page.getByTestId("input-email").fill(email);
    await page.getByTestId("input-password").fill(password);
    // J51 — usuário novo (onboarding_concluido=false) cai no wizard, não no
    // dashboard. Pular por agora → dashboard da persona.
    await Promise.all([
      page.waitForURL(/\/onboarding/),
      page.getByTestId("button-login").click(),
    ]);
    await Promise.all([
      page.waitForURL(/\/contratante\/dashboard/),
      page.getByTestId("button-onboarding-skip").click(),
    ]);

    await expect(page.getByTestId("banner-email-unverified")).toHaveCount(0);
  });

  test("empreiteiro: cadastro -> verificar email -> entra no dashboard", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("empreiteiro");
    const username = uniqueUsername("empreiteiro");
    const password = "Senha@123";

    await page.goto("/cadastro?perfil=empreiteiro");
    await expect(page.getByTestId("text-perfil-badge")).toHaveText("Empreiteiro");

    await page.getByTestId("input-name").fill("Empreiteiro E2E");
    await page.getByTestId("input-email").fill(email);
    await page.getByTestId("input-username").fill(username);
    await page.getByTestId("input-phone").fill("11988880000");
    await page.getByTestId("input-cpfcnpj").fill("52998224725");
    await page.getByTestId("input-password").fill(password);
    await page.getByTestId("checkbox-terms").click();

    await Promise.all([
      page.waitForURL(/\/verificar-email/),
      page.getByTestId("button-register").click(),
    ]);

    const verification = await waitForVerificationEmail(request, email);
    const verificationUrl = verification.meta?.verificationUrl as string;
    expect(verificationUrl).toContain("/api/auth/verify-email?token=");

    const verifyParsed = new URL(verificationUrl);
    await page.goto(`${verifyParsed.pathname}${verifyParsed.search}`);
    await expect(page).toHaveURL(/\/verificar-email\?success=verified/);

    await page.goto("/login?perfil=empreiteiro");
    await page.getByTestId("input-email").fill(email);
    await page.getByTestId("input-password").fill(password);
    // J51 — wizard de onboarding intercepta o login do usuário novo. Pular → dashboard.
    await Promise.all([
      page.waitForURL(/\/onboarding/),
      page.getByTestId("button-login").click(),
    ]);
    await Promise.all([
      page.waitForURL(/\/empreiteiro\/dashboard/),
      page.getByTestId("button-onboarding-skip").click(),
    ]);

    await expect(page.getByTestId("banner-email-unverified")).toHaveCount(0);
  });

  test("sem verificar email: criar obra é bloqueada (banner + 403)", async ({
    page,
    request,
  }) => {
    const email = uniqueEmail("contratante-bloqueado");
    const username = uniqueUsername("blocked");
    const password = "Senha@123";

    // 1) Cadastro: cria o usuário SEM clicar no link de verificação.
    await page.goto("/cadastro?perfil=contratante");
    await page.getByTestId("input-name").fill("Bloqueado E2E");
    await page.getByTestId("input-email").fill(email);
    await page.getByTestId("input-username").fill(username);
    await page.getByTestId("input-phone").fill("11977770000");
    await page.getByTestId("input-cpfcnpj").fill("52998224725");
    await page.getByTestId("input-password").fill(password);
    await page.getByTestId("checkbox-terms").click();
    await Promise.all([
      page.waitForURL(/\/verificar-email/),
      page.getByTestId("button-register").click(),
    ]);
    await waitForVerificationEmail(request, email);

    // 2) /api/auth/login bloqueia com 403 EMAIL_NOT_VERIFIED — confirma o gate de login.
    const loginRes = await request.post("/api/auth/login", { data: { email, password } });
    expect(loginRes.status()).toBe(403);
    expect((await loginRes.json()).error).toBe("EMAIL_NOT_VERIFIED");

    // 3) Emite cookies de auth para o user (test-only) — simula "logado mas
    //    com email pendente". Usa page.request para compartilhar cookie jar
    //    com a navegação subsequente.
    const loginAs = await page.request.post("/api/test/login-as", { data: { email } });
    expect(loginAs.ok()).toBeTruthy();
    expect((await loginAs.json()).user.emailVerified).toBeFalsy();

    // 4) POST /api/obras precisa retornar 403 EMAIL_NOT_VERIFIED, mesmo autenticado.
    const createRes = await page.request.post("/api/obras", {
      data: { nome: "Obra E2E", endereco: "Rua Teste, 123" },
    });
    expect(createRes.status()).toBe(403);
    expect((await createRes.json()).error).toBe("EMAIL_NOT_VERIFIED");

    // 5) UI: o banner "verifique seu email" aparece no dashboard do contratante.
    await page.goto("/contratante/dashboard");
    await expect(page.getByTestId("banner-email-unverified")).toBeVisible();

    // 6) Sem auth → 401 (sanity check do guard).
    const unauth = await request.post("/api/obras", { data: { nome: "X", endereco: "Y" } });
    expect(unauth.status()).toBe(401);
  });

  test("OAuth Google: persona empreiteiro da landing é respeitada", async ({
    page,
    context,
  }) => {
    const request = page.request; // compartilha cookie jar (x_signup_persona)

    await page.goto("/cadastro?perfil=empreiteiro");
    await page.route("**/api/auth/signin/google**", (route) => {
      route.fulfill({ status: 200, body: "intercepted" });
    });
    await page.getByTestId("button-google-register").click();

    await expect
      .poll(async () =>
        (await context.cookies()).find((c) => c.name === "x_signup_persona")?.value
      )
      .toBe("empreiteiro");

    const email = uniqueEmail("oauth-empreiteiro");
    const simRes = await request.post("/api/test/oauth-simulate", {
      data: { email, name: "OAuth Empreiteiro" },
    });
    expect(simRes.ok()).toBeTruthy();
    expect((await simRes.json()).user.role).toBe("contratante"); // default

    const convertRes = await request.post("/api/auth/oauth-convert");
    expect(convertRes.ok()).toBeTruthy();
    const convertBody = await convertRes.json();
    expect(convertBody.user.role).toBe("empreiteiro");
    expect(convertBody.user.email).toBe(email);

    const me = await (await request.get("/api/auth/me")).json();
    expect(me.role).toBe("empreiteiro");
    expect(me.email).toBe(email);

    await request.delete(`/api/test/oauth-simulate?email=${encodeURIComponent(email)}`);
  });

  test("OAuth Google: persona contratante da landing é respeitada", async ({
    page,
    context,
  }) => {
    const request = page.request;

    await page.goto("/cadastro?perfil=contratante");
    await page.route("**/api/auth/signin/google**", (route) => {
      route.fulfill({ status: 200, body: "intercepted" });
    });
    await page.getByTestId("button-google-register").click();

    await expect
      .poll(async () =>
        (await context.cookies()).find((c) => c.name === "x_signup_persona")?.value
      )
      .toBe("contratante");

    const email = uniqueEmail("oauth-contratante");
    const simRes = await request.post("/api/test/oauth-simulate", {
      data: { email, name: "OAuth Contratante" },
    });
    expect(simRes.ok()).toBeTruthy();

    const convertRes = await request.post("/api/auth/oauth-convert");
    expect(convertRes.ok()).toBeTruthy();
    const convertBody = await convertRes.json();
    expect(convertBody.user.role).toBe("contratante");
    expect(convertBody.user.email).toBe(email);

    await request.delete(`/api/test/oauth-simulate?email=${encodeURIComponent(email)}`);
  });
});
