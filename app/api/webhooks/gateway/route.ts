import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getPaymentGateway } from "@features/planos/gateway";
import { aplicarEventoWebhook } from "@features/planos/assinatura-service";
import { getClientIp } from "@features/auth/api/rate-limit";
import { db } from "@shared/db/db";

/**
 * POST /api/webhooks/gateway — recebe eventos do gateway de pagamento (J11).
 *
 * Público por natureza (o gateway chama). A AUTENTICIDADE é validada dentro de
 * `gateway.parseWebhook` (verificação de assinatura do payload no adapter real).
 * O processamento é IDEMPOTENTE: o mesmo eventId nunca é aplicado duas vezes
 * (índice único em assinatura_eventos.gateway_event_id).
 *
 * O IP do chamador é resolvido aqui (via `getClientIp`, que respeita
 * TRUST_PROXY_HEADERS) e passado explicitamente para o adapter — garantindo
 * que nenhum header arbitrário controlado pelo chamador sirva como identidade.
 *
 * Resiliência a banco indisponível (Task #172 / J14 §13):
 * - O payload é persistido em `webhook_delivery_log` ANTES do processamento.
 * - Se o banco estiver fora, um console.error estruturado com o payload completo
 *   permite replay manual.
 * - A cada request, eventos com status "pending" ou "failed" (até 5 tentativas,
 *   criados há menos de 24h) são reprocessados de forma oportunística.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => "");
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k] = v;
  });

  const clientIp = getClientIp(request);

  let evt;
  try {
    evt = await getPaymentGateway().parseWebhook(rawBody, headers, clientIp);
  } catch (err) {
    console.error("[webhooks/gateway] assinatura inválida ou payload malformado:", err);
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  if (evt.type === "ignored") {
    return NextResponse.json({ received: true, processed: false });
  }

  // ── Persistir evento antes de processar ─────────────────────────────────
  // Se o banco estiver indisponível, registramos no console com payload completo
  // para permitir replay manual. Quando disponível, usamos webhook_delivery_log
  // como dead-letter / retry queue.
  const evtPayload = {
    eventId: evt.eventId,
    type: evt.type,
    gatewaySubscriptionId: evt.gatewaySubscriptionId,
    gatewayCustomerId: evt.gatewayCustomerId,
    externalReference: evt.externalReference,
    valor: evt.valor,
  };

  let logId: string | null = null;
  try {
    const rows = await db.execute<{ id: string }>(sql`
      INSERT INTO webhook_delivery_log
        (gateway_event_id, event_type, raw_body, headers_json, status)
      VALUES
        (${evt.eventId}, ${evt.type}, ${rawBody}, ${JSON.stringify(headers)}::jsonb, 'pending')
      ON CONFLICT (gateway_event_id) DO UPDATE
        SET retry_count = webhook_delivery_log.retry_count + 1,
            status = CASE
              WHEN webhook_delivery_log.status = 'processed' THEN 'processed'
              ELSE 'pending'
            END
      RETURNING id
    `);
    logId = (rows.rows[0] as { id: string } | undefined)?.id ?? null;

    // Se o evento já foi processado (ON CONFLICT retorna a row existente), não
    // reprocessamos. A idempotência definitiva é garantida por assinatura_eventos,
    // mas este atalho evita trabalho desnecessário.
    if (logId) {
      const [existing] = await db.execute<{ status: string }>(sql`
        SELECT status FROM webhook_delivery_log WHERE id = ${logId}
      `).then((r) => r.rows as { status: string }[]).catch(() => []);
      if (existing?.status === "processed") {
        return NextResponse.json({ received: true, processed: false });
      }
    }
  } catch (dbErr) {
    // Banco indisponível — loga o payload completo para replay manual.
    console.error(
      "[webhooks/gateway] BANCO INDISPONÍVEL — evento NÃO persistido. Payload para replay manual:",
      JSON.stringify(evtPayload),
      "Erro:",
      dbErr,
    );
    // Retorna 500 para que o gateway reenvie.
    return NextResponse.json({ error: "PROCESSING_ERROR" }, { status: 500 });
  }

  // ── Reprocessamento oportunístico de eventos pendentes/falhos ───────────
  // Executa antes do evento principal para não atrasar a resposta de forma
  // perceptível (rápido: no máximo 5 eventos, timeout implícito do gateway).
  await retryPendingEvents(logId).catch((err) => {
    console.warn("[webhooks/gateway] retry oportunístico falhou:", err);
  });

  // ── Processamento do evento principal ───────────────────────────────────
  try {
    const result = await aplicarEventoWebhook(evtPayload);

    await db.execute(sql`
      UPDATE webhook_delivery_log
         SET status = 'processed',
             processed_at = NOW(),
             last_error = NULL
       WHERE id = ${logId}
    `).catch(() => {});

    return NextResponse.json({ received: true, processed: result.processed });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(
      "[webhooks/gateway] falha ao aplicar evento. Payload para replay manual:",
      JSON.stringify(evtPayload),
      "Erro:",
      errMsg,
    );

    await db.execute(sql`
      UPDATE webhook_delivery_log
         SET status = 'failed',
             last_error = ${errMsg}
       WHERE id = ${logId}
    `).catch(() => {});

    return NextResponse.json({ error: "PROCESSING_ERROR" }, { status: 500 });
  }
}

/**
 * Reprocessa eventos pendentes/falhos com até MAX_RETRIES tentativas,
 * criados nas últimas 24 horas — excluindo o evento recém-chegado (excludeId).
 * Execução oportunística: falhas aqui são logadas mas não afetam a resposta.
 */
const MAX_RETRIES = 5;
const RETRY_WINDOW_HOURS = 24;

async function retryPendingEvents(excludeId: string | null): Promise<void> {
  const candidates = await db.execute<{
    id: string;
    gateway_event_id: string;
    event_type: string;
    retry_count: number;
  }>(sql`
    SELECT id, gateway_event_id, event_type, retry_count
      FROM webhook_delivery_log
     WHERE status IN ('pending', 'failed')
       AND retry_count < ${MAX_RETRIES}
       AND created_at > NOW() - (${RETRY_WINDOW_HOURS} || ' hours')::interval
       AND (${excludeId} IS NULL OR id <> ${excludeId})
     ORDER BY created_at ASC
     LIMIT 5
  `).then((r) => r.rows as { id: string; gateway_event_id: string; event_type: string; retry_count: number }[])
    .catch(() => []);

  for (const row of candidates) {
    try {
      // Recupera o payload original do raw_body para reconstruir o evento.
      const [logRow] = await db.execute<{ raw_body: string; headers_json: string }>(sql`
        SELECT raw_body, headers_json FROM webhook_delivery_log WHERE id = ${row.id}
      `).then((r) => r.rows as { raw_body: string; headers_json: string }[]);

      if (!logRow) continue;

      // Re-parseia o evento do payload original para obter os campos normalizados.
      const headers = typeof logRow.headers_json === "object"
        ? (logRow.headers_json as Record<string, string>)
        : (JSON.parse(logRow.headers_json) as Record<string, string>);
      const clientIp = (headers["x-forwarded-for"] ?? headers["x-real-ip"] ?? "retry").split(",")[0].trim();

      let retryEvt;
      try {
        retryEvt = await getPaymentGateway().parseWebhook(logRow.raw_body, headers, clientIp);
      } catch {
        // Payload inválido — marca como falha permanente (não vale tentar de novo).
        await db.execute(sql`
          UPDATE webhook_delivery_log
             SET status = 'failed',
                 retry_count = retry_count + 1,
                 last_error = 'parseWebhook falhou no retry — payload inválido'
           WHERE id = ${row.id}
        `).catch(() => {});
        continue;
      }

      if (retryEvt.type === "ignored") {
        await db.execute(sql`
          UPDATE webhook_delivery_log SET status = 'processed', processed_at = NOW() WHERE id = ${row.id}
        `).catch(() => {});
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

      await db.execute(sql`
        UPDATE webhook_delivery_log
           SET status = 'processed',
               processed_at = NOW(),
               last_error = NULL
         WHERE id = ${row.id}
      `).catch(() => {});

      console.info(
        `[webhooks/gateway] retry bem-sucedido: id=${row.id} eventId=${row.gateway_event_id} type=${row.event_type}`,
      );
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      await db.execute(sql`
        UPDATE webhook_delivery_log
           SET retry_count = retry_count + 1,
               last_error = ${errMsg}
         WHERE id = ${row.id}
      `).catch(() => {});
      console.warn(
        `[webhooks/gateway] retry falhou: id=${row.id} eventId=${row.gateway_event_id} erro=${errMsg}`,
      );
    }
  }
}
