import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * XG52 — autorização das rotas de cron (`Authorization: Bearer <CRON_SECRET>`).
 *
 * - sem `CRON_SECRET` configurado: `sem_secret` (a rota responde 503, nunca roda aberta);
 * - header ausente ou diferente: `negado` (401);
 * - a comparação é de tempo constante sobre o SHA-256 dos dois lados, então o
 *   tamanho do segredo também não vaza.
 */
export type ResultadoCron = 'ok' | 'sem_secret' | 'negado';

export function autorizarCron(authorization: string | null | undefined, segredo: string | null | undefined): ResultadoCron {
  if (!segredo || segredo.trim().length === 0) return 'sem_secret';
  const m = /^Bearer\s+(.+)$/i.exec((authorization ?? '').trim());
  if (!m) return 'negado';
  const recebido = createHash('sha256').update(m[1].trim()).digest();
  const esperado = createHash('sha256').update(segredo.trim()).digest();
  return timingSafeEqual(recebido, esperado) ? 'ok' : 'negado';
}
