/**
 * Helpers anti-bot para endpoints públicos de auth.
 *
 * Combina dois sinais simples:
 *  - honeypot: campo `website` invisível no DOM. Bots tendem a preencher.
 *  - timing: `mountedAt` (ms epoch) capturado no client quando o form
 *    montou. Submits em < 1.5s ou com clock muito divergente são suspeitos.
 *
 * Em caso de falha, devolvemos sempre uma mensagem genérica e status 400
 * para não dar pista aos bots de qual sinal disparou.
 */

const MIN_DWELL_MS = 1500;
const MAX_FORM_AGE_MS = 60 * 60 * 1000; // 1h

export interface AntiBotResult {
  ok: boolean;
  reason?: "honeypot" | "too_fast" | "stale" | "invalid_payload";
}

export function validateAntiBot(body: unknown): AntiBotResult {
  if (!body || typeof body !== "object") {
    return { ok: false, reason: "invalid_payload" };
  }
  const b = body as Record<string, unknown>;

  // Honeypot — qualquer valor não vazio é suspeito
  if (typeof b.website === "string" && b.website.trim().length > 0) {
    return { ok: false, reason: "honeypot" };
  }

  const mountedAt = b.mountedAt;
  if (typeof mountedAt !== "number" || !Number.isFinite(mountedAt)) {
    return { ok: false, reason: "invalid_payload" };
  }

  const now = Date.now();
  // Tolerância: o cliente pode estar com pequeno skew de relógio.
  // Aceitamos mountedAt até 5min no futuro.
  if (mountedAt > now + 5 * 60 * 1000) {
    return { ok: false, reason: "invalid_payload" };
  }
  const dwell = now - mountedAt;
  if (dwell < MIN_DWELL_MS) {
    return { ok: false, reason: "too_fast" };
  }
  if (dwell > MAX_FORM_AGE_MS) {
    return { ok: false, reason: "stale" };
  }

  return { ok: true };
}
