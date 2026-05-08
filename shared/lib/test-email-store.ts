/**
 * In-memory captura de emails enviados quando EMAIL_TEST_MODE=1.
 *
 * Usado pelos testes E2E para inspecionar o link de verificação enviado
 * (sem precisar bater no Resend de verdade).
 *
 * NUNCA usar em produção — só é alimentado quando EMAIL_TEST_MODE=1.
 */

export type CapturedEmail = {
  id: string;
  to: string;
  subject: string;
  html: string;
  meta?: Record<string, unknown>;
  sentAt: string;
};

declare global {
  // eslint-disable-next-line no-var
  var __X_TEST_EMAIL_STORE__: CapturedEmail[] | undefined;
}

function getStore(): CapturedEmail[] {
  if (!globalThis.__X_TEST_EMAIL_STORE__) {
    globalThis.__X_TEST_EMAIL_STORE__ = [];
  }
  return globalThis.__X_TEST_EMAIL_STORE__;
}

export function isEmailTestMode(): boolean {
  return process.env.EMAIL_TEST_MODE === "1";
}

export function captureTestEmail(email: Omit<CapturedEmail, "id" | "sentAt">): CapturedEmail {
  const captured: CapturedEmail = {
    ...email,
    id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sentAt: new Date().toISOString(),
  };
  getStore().unshift(captured);
  return captured;
}

export function listTestEmails(filter?: { to?: string }): CapturedEmail[] {
  const all = getStore();
  if (!filter?.to) return all;
  const target = filter.to.toLowerCase();
  return all.filter((e) => e.to.toLowerCase() === target);
}

export function clearTestEmails(): void {
  getStore().length = 0;
}
