interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * Verifica e registra uma tentativa. Retorna true se deve bloquear.
 * @param key     chave única (ex: "login:1.2.3.4")
 * @param max     número máximo de tentativas na janela
 * @param windowMs tamanho da janela em ms
 */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  // Bypass total quando em modo de teste E2E — evita falsos positivos quando
  // a suíte registra/loga várias vezes do mesmo IP (127.0.0.1).
  if (process.env.EMAIL_TEST_MODE === "1") return false;

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count += 1;
  return entry.count > max;
}

/** Extrai o IP do cliente a partir dos headers da request */
export function getClientIp(request: Request): string {
  const headers = new Headers((request as Request).headers);
  return (
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
