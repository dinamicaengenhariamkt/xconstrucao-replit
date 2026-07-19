import { test, expect, type APIRequestContext } from "@playwright/test";
import { loginAs, logout, fetchCapturedEmails, clearCapturedEmails, type CapturedEmail } from "../helpers";

/**
 * Integração (J36) — G4: resets de acesso admin.
 *
 * Cobre os endpoints admin que resetam o acesso de um usuário emitindo um
 * password_setup_token, e FECHA a pendência do G1: o fluxo feliz + reuso do
 * POST /api/auth/definir-senha-inicial (o único token single-use REAL), que o G1
 * não pôde exercitar porque quem emite o token é justamente um reset admin.
 * Endpoints:
 *   - POST /api/admin/clientes/[id]/reset-senha
 *   - POST /api/admin/empreiteiras/[id]/reset-acesso
 *   - POST /api/admin/usuarios/[id]/reset-password   (só authz — ver nota)
 *   - POST /api/auth/definir-senha-inicial            (consome o token)
 *
 * Descobertas técnicas (ver J36 §10):
 *   - Os 3 resets emitem um password_setup_token real (issueSetupToken), setam
 *     users.mustChangePassword=true e invalidam a senha atual. Disparam email
 *     kind='password-setup' com a URL em meta.setupUrl. O token em claro só existe
 *     no email (a tabela guarda só o hash) → capturar via /api/test/emails.
 *   - clientes/reset-senha e empreiteiras/reset-acesso usam requireAdmin → admin de
 *     seed passa. usuarios/reset-password usa hasUsersTabAccess (superadmin sempre
 *     passa). Descoberta: `admin@xconstrucao.com` é PROMOVIDO a superadmin no boot
 *     (server/bootstrap-superadmin.ts) → passa em hasUsersTabAccess e pode resetar
 *     qualquer role. Por isso o endpoint 3 é coberto por completo (authz + fluxo
 *     feliz modo 'link', que emite setup token e volta setupUrl no corpo).
 *   - definir-senha-inicial valida a política ANTES de consumir → senha fraca NÃO
 *     queima o token (dá 400 e o link segue válido). Só consome no caminho forte.
 *   - Isolamento: o reset invalida a senha do João/Maria + mustChangePassword=true;
 *     o fluxo feliz de definir-senha-inicial restaura mustChangePassword=false e uma
 *     senha conhecida. Nenhum outro spec depende da senha literal (todos usam
 *     login-as). Cada reset de João/Maria conclui com um definir-senha-inicial ok.
 *
 * Pré-requisitos (playwright.config.ts): E2E_TEST_AUTH=1; EMAIL_TEST_MODE=1; seed
 * com joão (contratante+cliente), maria (empreiteiro+empreiteira), admin.
 */

const CONTRATANTE_EMAIL = "joao@construtora.com";
const EMPREITEIRO_EMAIL = "maria@empreiteira.com";
const ADMIN_EMAIL = "admin@xconstrucao.com";

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

/** Descobre o id da linha `clientes`/`empreiteiras` pelo email (via listagem admin). */
async function idPorEmail(
  request: APIRequestContext,
  recurso: "clientes" | "empreiteiras",
  email: string
): Promise<string | null> {
  await loginAs(request, ADMIN_EMAIL);
  const res = await request.get(`/api/admin/${recurso}`);
  const arr: Array<{ id: string; email?: string }> = res.ok() ? await res.json() : [];
  await logout(request);
  return arr.find((x) => x.email === email)?.id ?? null;
}

/** Descobre o users.id pelo email (via GET /api/admin/usuarios como superadmin). */
async function userIdPorEmail(request: APIRequestContext, email: string): Promise<string | null> {
  await loginAs(request, ADMIN_EMAIL);
  const res = await request.get(`/api/admin/usuarios?q=${encodeURIComponent(email)}`);
  const payload = res.ok() ? await res.json() : { rows: [] };
  const rows: Array<{ id: string; email: string }> = payload.rows ?? [];
  await logout(request);
  return rows.find((u) => u.email === email)?.id ?? null;
}

/** Reseta (via admin) e captura o setup token do email. */
async function resetarECapturarToken(
  request: APIRequestContext,
  resetPath: string,
  destinatario: string
): Promise<string | null> {
  await clearCapturedEmails(request);
  await loginAs(request, ADMIN_EMAIL);
  const res = await request.post(resetPath);
  expect(res.status(), `reset deveria dar 200; corpo: ${await res.text()}`).toBe(200);
  expect((await res.json()).success).toBe(true);
  await logout(request);

  const url = await waitForEmailUrl(request, destinatario, "password-setup", "setupUrl");
  return url ? tokenFrom(url) : null;
}

const UUID_INEXISTENTE = "00000000-0000-0000-0000-000000000000";

test.describe.serial("Integração — G4: resets de acesso admin", () => {
  // ---- clientes/[id]/reset-senha -------------------------------------------

  test("clientes/reset-senha: anônimo → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post(`/api/admin/clientes/${UUID_INEXISTENTE}/reset-senha`);
    expect(res.status()).toBe(401);
  });

  test("clientes/reset-senha: não-admin (contratante) → 403", async ({ request }) => {
    await loginAs(request, CONTRATANTE_EMAIL);
    const res = await request.post(`/api/admin/clientes/${UUID_INEXISTENTE}/reset-senha`);
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("clientes/reset-senha: cliente inexistente → 404", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);
    const res = await request.post(`/api/admin/clientes/${UUID_INEXISTENTE}/reset-senha`);
    expect(res.status()).toBe(404);
    await logout(request);
  });

  test("clientes/reset-senha → definir-senha-inicial: feliz + senha fraca não queima + reuso (fecha G1)", async ({
    request,
  }) => {
    const clienteId = await idPorEmail(request, "clientes", CONTRATANTE_EMAIL);
    test.skip(!clienteId, "cliente do joão não encontrado no seed");

    const token = await resetarECapturarToken(
      request,
      `/api/admin/clientes/${clienteId}/reset-senha`,
      CONTRATANTE_EMAIL
    );
    expect(token, "setup token deve ter chegado por email").toBeTruthy();

    // senha fraca → 400, MAS não consome o token (política é checada antes do consume).
    const fraca = await request.post("/api/auth/definir-senha-inicial", {
      data: { token: token!, password: "12345678", confirmPassword: "12345678" },
    });
    expect(fraca.status(), "senha fraca → 400").toBe(400);

    // senha forte com o MESMO token → 200 (prova que a tentativa fraca não queimou o link).
    // NB: a política rejeita senha que contenha nome/username/email — evitar "joao".
    const senha = "Kr!ptaVerde#Solida2026";
    const feliz = await request.post("/api/auth/definir-senha-inicial", {
      data: { token: token!, password: senha, confirmPassword: senha },
    });
    expect(feliz.status(), `definir-senha-inicial feliz → 200; corpo: ${await feliz.text()}`).toBe(200);
    expect((await feliz.json()).success).toBe(true);

    // reuso do mesmo token (single-use real) → 400 inválido/expirado.
    const reuso = await request.post("/api/auth/definir-senha-inicial", {
      data: { token: token!, password: senha, confirmPassword: senha },
    });
    expect(reuso.status(), "reuso do token → 400").toBe(400);
    expect(String((await reuso.json()).message ?? "")).toMatch(/inválido|expirado/i);
  });

  // ---- empreiteiras/[id]/reset-acesso --------------------------------------

  test("empreiteiras/reset-acesso: não-admin → 403", async ({ request }) => {
    await loginAs(request, EMPREITEIRO_EMAIL);
    const res = await request.post(`/api/admin/empreiteiras/${UUID_INEXISTENTE}/reset-acesso`);
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("empreiteiras/reset-acesso → definir-senha-inicial: feliz (consome token por este endpoint também)", async ({
    request,
  }) => {
    const empreiteiraId = await idPorEmail(request, "empreiteiras", EMPREITEIRO_EMAIL);
    test.skip(!empreiteiraId, "empreiteira da maria não encontrada no seed");

    const token = await resetarECapturarToken(
      request,
      `/api/admin/empreiteiras/${empreiteiraId}/reset-acesso`,
      EMPREITEIRO_EMAIL
    );
    expect(token, "setup token deve ter chegado por email").toBeTruthy();

    // Consome (restaura mustChangePassword=false + senha conhecida — isolamento).
    // NB: a política rejeita senha que contenha nome/username/email — evitar "maria".
    const senha = "Br!lhoAzul#Firme2026";
    const feliz = await request.post("/api/auth/definir-senha-inicial", {
      data: { token: token!, password: senha, confirmPassword: senha },
    });
    expect(feliz.status(), `definir-senha-inicial feliz → 200; corpo: ${await feliz.text()}`).toBe(200);
    expect((await feliz.json()).success).toBe(true);
  });

  // ---- usuarios/[id]/reset-password (superadmin — authz + fluxo feliz link) --

  test("usuarios/reset-password: anônimo → 401", async ({ request }) => {
    await logout(request);
    const res = await request.post(`/api/admin/usuarios/${UUID_INEXISTENTE}/reset-password`, {
      data: { senhaModo: "random" },
    });
    expect(res.status()).toBe(401);
  });

  test("usuarios/reset-password: não-admin (empreiteiro) → 403", async ({ request }) => {
    await loginAs(request, EMPREITEIRO_EMAIL);
    const res = await request.post(`/api/admin/usuarios/${UUID_INEXISTENTE}/reset-password`, {
      data: { senhaModo: "random" },
    });
    expect(res.status()).toBe(403);
    await logout(request);
  });

  test("usuarios/reset-password: usuário inexistente → 404", async ({ request }) => {
    await loginAs(request, ADMIN_EMAIL);
    const res = await request.post(`/api/admin/usuarios/${UUID_INEXISTENTE}/reset-password`, {
      data: { senhaModo: "random" },
    });
    expect(res.status()).toBe(404);
    await logout(request);
  });

  test("usuarios/reset-password: payload inválido (senhaModo faltando) → 400", async ({ request }) => {
    const userId = await userIdPorEmail(request, CONTRATANTE_EMAIL);
    test.skip(!userId, "usuário do joão não encontrado");
    await loginAs(request, ADMIN_EMAIL);
    const res = await request.post(`/api/admin/usuarios/${userId}/reset-password`, { data: {} });
    expect(res.status()).toBe(400);
    await logout(request);
  });

  test("usuarios/reset-password modo 'link' → 200 { setupUrl } no corpo; consome o token", async ({ request }) => {
    const userId = await userIdPorEmail(request, CONTRATANTE_EMAIL);
    test.skip(!userId, "usuário do joão não encontrado");

    await loginAs(request, ADMIN_EMAIL);
    const res = await request.post(`/api/admin/usuarios/${userId}/reset-password`, {
      data: { senhaModo: "link" },
    });
    expect(res.status(), `reset-password link → 200; corpo: ${await res.text()}`).toBe(200);
    const body = await res.json();
    // No modo link o setupUrl volta no corpo (não precisa do email) e passwordPlain é null.
    expect(typeof body.setupUrl).toBe("string");
    expect(body.passwordPlain).toBeNull();
    await logout(request);

    const token = tokenFrom(body.setupUrl);
    expect(token, "token deve ser extraível do setupUrl").toBeTruthy();

    // Consome (restaura mustChangePassword=false + senha conhecida — isolamento do joão).
    const senha = "V3rde!Firme#Solido2026";
    const feliz = await request.post("/api/auth/definir-senha-inicial", {
      data: { token: token!, password: senha, confirmPassword: senha },
    });
    expect(feliz.status(), `definir-senha-inicial feliz → 200; corpo: ${await feliz.text()}`).toBe(200);
    expect((await feliz.json()).success).toBe(true);
  });
});
