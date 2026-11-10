interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/**
 * PUB-03 — o Map só crescia: cada chave (IP, IP+token, e-mail…) ficava para
 * sempre, mesmo vencida. A varredura roda no máximo uma vez por intervalo e
 * remove as janelas encerradas; uma janela vencida já seria reiniciada no
 * próximo acesso, então apagá-la não muda nenhum limite.
 */
const SWEEP_INTERVAL_MS = 60_000;
let lastSweepAt = 0;

export function sweepExpiredRateLimits(now = Date.now()): number {
  let removed = 0;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
      removed += 1;
    }
  }
  lastSweepAt = now;
  return removed;
}

export function rateLimitStoreSizeForTests(): number {
  return store.size;
}

export interface RateLimitResult {
  limited: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * Registra uma tentativa e devolve metadados para respostas 429 precisas.
 * O parâmetro `now` existe para permitir testes determinísticos.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  if (process.env.EMAIL_TEST_MODE === "1") {
    return {
      limited: false,
      limit: max,
      remaining: max,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
    };
  }

  if (now - lastSweepAt >= SWEEP_INTERVAL_MS) sweepExpiredRateLimits(now);

  const current = store.get(key);
  const entry =
    !current || now >= current.resetAt
      ? { count: 1, resetAt: now + windowMs }
      : { count: current.count + 1, resetAt: current.resetAt };

  store.set(key, entry);
  const limited = entry.count > max;
  return {
    limited,
    limit: max,
    remaining: Math.max(0, max - entry.count),
    resetAt: entry.resetAt,
    retryAfterSeconds: limited
      ? Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
      : 0,
  };
}

/**
 * Verifica e registra uma tentativa. Retorna true se deve bloquear.
 * @param key     chave única (ex: "login:1.2.3.4")
 * @param max     número máximo de tentativas na janela
 * @param windowMs tamanho da janela em ms
 */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  return checkRateLimit(key, max, windowMs).limited;
}

export function resetRateLimitStoreForTests(): void {
  store.clear();
  lastSweepAt = 0;
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
