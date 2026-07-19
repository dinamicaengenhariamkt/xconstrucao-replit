#!/usr/bin/env tsx
/**
 * Job CLI para reprocessar webhooks ASAAS pendentes/falhos.
 *
 * Uso:
 *   npx tsx scripts/webhook-retry-pending.ts [--limit=50]
 *
 * Configuração em produção (Replit Scheduled Deployment):
 *   - Command: npx tsx scripts/webhook-retry-pending.ts
 *   - Schedule: a cada hora (ou frequência desejada)
 *
 * Reprocessa eventos em webhook_delivery_log com:
 *   - status IN ('pending', 'failed')
 *   - retry_count < 5
 *   - created_at nas últimas 24h
 *
 * Idempotente — pode rodar quantas vezes for preciso.
 * Saída exit code 0 sucesso, 1 falha.
 */
import { retryPendingWebhookEvents } from "../features/planos/webhook-retry-job";

async function main() {
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : 50;

  console.info(`[webhook-retry-cli] iniciando retry (limit=${limit})`);

  const result = await retryPendingWebhookEvents(null, limit);

  if (!result.ok) {
    console.error("[webhook-retry-cli] erro:", result.error);
    process.exit(1);
  }

  console.info(
    `[webhook-retry-cli] OK retried=${result.retried} succeeded=${result.succeeded} failed=${result.failed} runAt=${result.runAt}`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("[webhook-retry-cli] erro inesperado:", err);
  process.exit(1);
});
