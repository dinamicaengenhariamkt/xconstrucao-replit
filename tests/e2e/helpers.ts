import { APIRequestContext, expect } from "@playwright/test";

/**
 * Emails do seed usados como default pelos utilitários compartilhados. Um spec
 * pode sobrescrevê-los passando argumentos explícitos.
 */
export const SEED_CONTRATANTE_EMAIL = "joao@construtora.com";
export const SEED_EMPREITEIRO_EMAIL = "maria@empreiteira.com";
export const SEED_ADMIN_EMAIL = "admin@xconstrucao.com";

/**
 * Autentica via endpoint test-only `POST /api/test/login-as` (habilitado por
 * E2E_TEST_AUTH=1). Emite os cookies de sessão pulando senha/verificação de
 * email. Se `password` for informado e o login-as falhar (ex.: test-auth
 * indisponível), faz fallback para um login real com o payload anti-bot.
 */
export async function loginAs(
  request: APIRequestContext,
  email: string,
  password?: string
): Promise<void> {
  const fast = await request.post("/api/test/login-as", { data: { email } });
  if (fast.ok()) return;

  if (password) {
    const res = await request.post("/api/auth/login", {
      data: { email, password, mountedAt: Date.now() - 3000, website: "" },
    });
    expect(
      res.ok(),
      `login real de ${email} deve responder ok (status ${res.status()})`
    ).toBeTruthy();
    return;
  }

  expect(
    fast.ok(),
    `login-as ${email} deve responder ok (status ${fast.status()})`
  ).toBeTruthy();
}

/** Encerra a sessão atual. Best-effort (nunca lança). */
export async function logout(request: APIRequestContext): Promise<void> {
  await request.post("/api/auth/logout").catch(() => {});
}

function asRows(payload: unknown): Array<Record<string, unknown>> {
  return Array.isArray(payload)
    ? (payload as Array<Record<string, unknown>>)
    : (((payload as { rows?: Array<Record<string, unknown>> })?.rows) ?? []);
}

/**
 * Conclui (via admin) todas as obras abertas do contratante para liberar a cota
 * do plano free. Best-effort — nunca lança. Envia `numero` junto para satisfazer
 * a revalidação `insertObraSchemaStrict` em obras publicadas sem número.
 */
export async function liberarCotaObras(
  request: APIRequestContext,
  {
    contratanteEmail = SEED_CONTRATANTE_EMAIL,
    adminEmail = SEED_ADMIN_EMAIL,
  }: { contratanteEmail?: string; adminEmail?: string } = {}
): Promise<void> {
  await loginAs(request, contratanteEmail);
  const listRes = await request.get("/api/obras");
  if (!listRes.ok()) {
    await logout(request);
    return;
  }
  const abertas = asRows(await listRes.json()).filter((o) => o.status !== "concluida");
  await logout(request);
  if (abertas.length === 0) return;

  await loginAs(request, adminEmail);
  for (const o of abertas) {
    await request
      .patch(`/api/obras/${o.id as string}`, { data: { status: "concluida", numero: "0" } })
      .catch(() => {});
  }
  await logout(request);
}

/** Conclui (via admin) uma obra específica para liberar a cota. Best-effort. */
export async function concluirObra(
  request: APIRequestContext,
  obraId: string,
  { adminEmail = SEED_ADMIN_EMAIL }: { adminEmail?: string } = {}
): Promise<void> {
  if (!obraId) return;
  await loginAs(request, adminEmail);
  await request
    .patch(`/api/obras/${obraId}`, { data: { status: "concluida", numero: "0" } })
    .catch(() => {});
  await logout(request);
}

export type CapturedEmail = {
  id: string;
  to: string;
  subject: string;
  html: string;
  meta?: Record<string, unknown> & { verificationUrl?: string };
  sentAt: string;
};

/** Gera um email único por execução para evitar colidir com cadastros antigos. */
export function uniqueEmail(prefix: string): string {
  const slug = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${prefix}+${slug}@xconstrucao-e2e.test`;
}

export function uniqueUsername(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

/** Busca emails capturados pelo modo de teste para um destinatário específico. */
export async function fetchCapturedEmails(
  request: APIRequestContext,
  to: string
): Promise<CapturedEmail[]> {
  const res = await request.get(`/api/test/emails?to=${encodeURIComponent(to)}`);
  expect(res.ok(), "endpoint /api/test/emails deve responder OK (EMAIL_TEST_MODE=1)").toBeTruthy();
  const body = (await res.json()) as { emails: CapturedEmail[] };
  return body.emails ?? [];
}

/** Faz polling até encontrar um email de verificação para o destinatário. */
export async function waitForVerificationEmail(
  request: APIRequestContext,
  to: string,
  { timeoutMs = 8000, intervalMs = 250 }: { timeoutMs?: number; intervalMs?: number } = {}
): Promise<CapturedEmail> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const emails = await fetchCapturedEmails(request, to);
    const verification = emails.find(
      (e) => e.meta?.kind === "verification" && typeof e.meta?.verificationUrl === "string"
    );
    if (verification) return verification;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Email de verificação para ${to} não chegou em ${timeoutMs}ms`);
}

/** Limpa o store de emails capturados (entre testes). */
export async function clearCapturedEmails(request: APIRequestContext): Promise<void> {
  await request.delete("/api/test/emails");
}
