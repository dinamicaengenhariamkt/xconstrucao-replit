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

/**
 * Extrai o IP do cliente a partir dos headers da request.
 *
 * `X-Forwarded-For` e `X-Real-IP` só são confiáveis quando o app roda atrás de
 * um proxy controlado (Replit, Vercel, Cloudflare, etc) — sem isso, qualquer
 * cliente pode spoofar esses headers e bypassar o tier IP do rate-limit.
 *
 * Comportamento:
 * - `TRUST_PROXY_HEADERS=1`: lê `X-Forwarded-For` (primeiro IP) → `X-Real-IP` → fallback.
 * - Caso contrário: ignora `X-Forwarded-For` e usa só `X-Real-IP` (alguns proxies setam mesmo sem trust).
 *
 * Em dev local sem proxy, o tier IP fica neutralizado (todas requests caem em "unknown"),
 * mas tiers `user`/`thread` continuam protegendo. Em produção, setar `TRUST_PROXY_HEADERS=1`.
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  const trustProxy = process.env.TRUST_PROXY_HEADERS === '1';
  if (trustProxy) {
    return (
      headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      headers.get('x-real-ip') ??
      'unknown'
    );
  }
  return headers.get('x-real-ip') ?? 'unknown';
}
