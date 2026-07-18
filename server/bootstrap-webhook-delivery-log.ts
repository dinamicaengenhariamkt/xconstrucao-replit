import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * Bootstrap idempotente — tabela webhook_delivery_log (J14 / Task #172).
 *
 * Finalidade: garantir que eventos de webhook do gateway de pagamento nunca
 * sejam perdidos silenciosamente quando o banco estiver temporariamente
 * indisponível. O endpoint persiste o payload RAW antes de processá-lo;
 * se o processamento falhar, o registro fica como "pending" ou "failed" e é
 * reprocessado na próxima requisição ao endpoint (retry oportunístico).
 *
 * Campos:
 *   gateway_event_id — id estável emitido pelo gateway (dedup com assinatura_eventos)
 *   event_type       — tipo normalizado (ex: payment_succeeded)
 *   raw_body         — payload bruto recebido (para replay manual se necessário)
 *   headers_json     — headers relevantes (ex: assinatura HMAC)
 *   status           — pending | processed | failed
 *   retry_count      — incrementado a cada tentativa malsucedida
 *   last_error       — mensagem do último erro (para diagnóstico)
 *   created_at       — quando o evento chegou
 *   processed_at     — quando foi processado com sucesso (NULL enquanto pendente)
 */
export async function bootstrapWebhookDeliveryLogSchema(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS webhook_delivery_log (
      id             VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
      gateway_event_id TEXT NOT NULL,
      event_type     TEXT NOT NULL,
      raw_body       TEXT NOT NULL DEFAULT '',
      headers_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
      status         TEXT NOT NULL DEFAULT 'pending',
      retry_count    INTEGER NOT NULL DEFAULT 0,
      last_error     TEXT,
      created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
      processed_at   TIMESTAMP
    )
  `);
  await db.execute(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS uq_webhook_delivery_log_event_id
      ON webhook_delivery_log(gateway_event_id)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_webhook_delivery_log_status
      ON webhook_delivery_log(status, created_at)
  `);
}
