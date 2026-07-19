import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { getPaymentGateway } from "@features/planos/gateway";
import { aplicarEventoWebhook } from "@features/planos/assinatura-service";

export const MAX_RETRIES = 5;
export const RETRY_WINDOW_HOURS = 24;

export interface WebhookRetryResult {
  ok: boolean;
  retried: number;
  succeeded: number;
  failed: number;
  runAt: string;
  error?: string;
}

/**
 * Reprocessa eventos pendentes/falhos com até MAX_RETRIES tentativas,
 * criados nas últimas RETRY_WINDOW_HOURS horas.
 *
 * Pode ser chamado:
 *  - Oportunisticamente a cada novo webhook (excludeId exclui o recém-chegado)
 *  - Periodicamente via script agendado (excludeId = null)
 *  - Manualmente via POST /api/admin/webhooks/retry-pending
 *
 * Idempotente: a idempotência definitiva é garantida por assinatura_eventos
 * (índice único em gateway_event_id).
 */
export async function retryPendingWebhookEvents(
  excludeId: string | null = null,
  limit = 20,
): Promise<WebhookRetryResult> {
  const runAt = new Date().toISOString();

  try {
    // Build the exclude clause conditionally to avoid null parameterization issues.
    // Use sql.raw for the numeric constants to avoid type-casting issues with `||`.
    const excludeClause = excludeId
      ? sql`AND id <> ${excludeId}`
      : sql``;

    // Fetch candidates — let DB errors propagate to the outer catch so the
    // caller sees ok:false instead of silently reporting 0 retried.
    const candidateResult = await db.execute<{
      id: string;
      gateway_event_id: string;
      event_type: string;
      retry_count: number;
    }>(sql`
      SELECT id, gateway_event_id, event_type, retry_count
        FROM webhook_delivery_log
       WHERE status IN ('pending', 'failed')
         AND retry_count < ${MAX_RETRIES}
         AND created_at > NOW() - INTERVAL '${sql.raw(String(RETRY_WINDOW_HOURS))} hours'
         ${excludeClause}
       ORDER BY created_at ASC
       LIMIT ${limit}
    `);

    const candidates = candidateResult.rows as {
      id: string;
      gateway_event_id: string;
      event_type: string;
      retry_count: number;
    }[];

    let succeeded = 0;
    let failed = 0;

    for (const row of candidates) {
      try {
        const [logRow] = await db
          .execute<{ raw_body: string; headers_json: string }>(sql`
            SELECT raw_body, headers_json FROM webhook_delivery_log WHERE id = ${row.id}
          `)
          .then((r) => r.rows as { raw_body: string; headers_json: string }[]);

        if (!logRow) {
          failed++;
          continue;
        }

        const headers =
          typeof logRow.headers_json === "object"
            ? (logRow.headers_json as Record<string, string>)
            : (JSON.parse(logRow.headers_json) as Record<string, string>);

        const clientIp = (
          headers["x-forwarded-for"] ??
          headers["x-real-ip"] ??
          "retry"
        )
          .split(",")[0]
          .trim();

        let retryEvt;
        try {
          retryEvt = await getPaymentGateway().parseWebhook(
            logRow.raw_body,
            headers,
            clientIp,
          );
        } catch {
          await db
            .execute(sql`
              UPDATE webhook_delivery_log
                 SET status = 'failed',
                     retry_count = retry_count + 1,
                     last_error = 'parseWebhook falhou no retry — payload inválido'
               WHERE id = ${row.id}
            `)
            .catch(() => {});
          failed++;
          continue;
        }

        if (retryEvt.type === "ignored") {
          await db
            .execute(sql`
              UPDATE webhook_delivery_log
                 SET status = 'processed', processed_at = NOW()
               WHERE id = ${row.id}
            `)
            .catch(() => {});
          succeeded++;
          continue;
        }

        await aplicarEventoWebhook({
          eventId: retryEvt.eventId,
          type: retryEvt.type,
          gatewaySubscriptionId: retryEvt.gatewaySubscriptionId,
          gatewayCustomerId: retryEvt.gatewayCustomerId,
          externalReference: retryEvt.externalReference,
          valor: retryEvt.valor,
        });

        await db
          .execute(sql`
            UPDATE webhook_delivery_log
               SET status = 'processed',
                   processed_at = NOW(),
                   last_error = NULL
             WHERE id = ${row.id}
          `)
          .catch(() => {});

        succeeded++;
        console.info(
          `[webhook-retry-job] sucesso: id=${row.id} eventId=${row.gateway_event_id} type=${row.event_type}`,
        );
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        await db
          .execute(sql`
            UPDATE webhook_delivery_log
               SET retry_count = retry_count + 1,
                   last_error = ${errMsg}
             WHERE id = ${row.id}
          `)
          .catch(() => {});
        failed++;
        console.warn(
          `[webhook-retry-job] falha: id=${row.id} eventId=${row.gateway_event_id} erro=${errMsg}`,
        );
      }
    }

    const retried = candidates.length;
    console.info(
      `[webhook-retry-job] runAt=${runAt} retried=${retried} succeeded=${succeeded} failed=${failed}`,
    );

    return { ok: true, retried, succeeded, failed, runAt };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[webhook-retry-job] falha geral:", err);
    return { ok: false, retried: 0, succeeded: 0, failed: 0, runAt, error: message };
  }
}
