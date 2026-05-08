import { APIRequestContext, expect } from "@playwright/test";

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
