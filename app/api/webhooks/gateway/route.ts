import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { getPaymentGateway } from "@features/planos/gateway";
import { aplicarEventoWebhook } from "@features/planos/assinatura-service";
import { aplicarEventoSubconta } from "@features/marketplace/aplicar-evento-subconta";
import { aplicarEventoSplit } from "@features/marketplace/aplicar-evento-split";
import { parseExternalRefObra } from "@features/marketplace/split-service";
import { aplicarEventoAnuncioPago } from "@features/anuncios/self-service/aplicar-evento-anuncio-pago";
import { parseExternalRefAnuncio } from "@features/anuncios/self-service/asaas-ad-billing";
import { getClientIp } from "@features/auth/api/rate-limit";
import { db } from "@shared/db/db";
import { retryPendingWebhookEvents } from "@features/planos/webhook-retry-job";

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
 * - Um job agendado (`scripts/webhook-retry-pending.ts`) reprocessa
 *   periodicamente sem depender da chegada de novos webhooks.
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
    // J46 — presentes apenas em eventos de conta/KYC (account_status_changed).
    accountId: evt.accountId,
    accountStatus: evt.accountStatus,
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
  await retryPendingWebhookEvents(logId, 5).catch((err) => {
    console.warn("[webhooks/gateway] retry oportunístico falhou:", err);
  });

  // ── Processamento do evento principal ───────────────────────────────────
  try {
    // Roteamento por natureza do evento (o caminho de ASSINATURA é o default e
    // permanece intacto):
    //   J46 — eventos de conta/KYC → aplicarEventoSubconta;
    //   J48 — pagamento de OBRA (externalReference `xconstrucao-obra|...`) →
    //         aplicarEventoSplit. A distinção de pagamento obra vs assinatura é
    //         pelo PREFIXO do externalReference (mesmo `type` payment_succeeded).
    const refObra = parseExternalRefObra(evtPayload.externalReference);
    const refAnuncio = parseExternalRefAnuncio(evtPayload.externalReference);
    let result;
    if (evtPayload.type === "account_status_changed") {
      result = await aplicarEventoSubconta({
        eventId: evtPayload.eventId,
        accountId: evtPayload.accountId,
        accountStatus: evtPayload.accountStatus,
      });
    } else if (
      refAnuncio &&
      (evtPayload.type === "payment_succeeded" || evtPayload.type === "payment_failed")
    ) {
      // J31 — pagamento de ANÚNCIO (externalReference `xconstrucao-anuncio|pedidoId`).
      result = await aplicarEventoAnuncioPago({
        eventId: evtPayload.eventId,
        type: evtPayload.type,
        pedidoId: refAnuncio.pedidoId,
      });
    } else if (
      refObra &&
      (evtPayload.type === "payment_succeeded" || evtPayload.type === "payment_failed")
    ) {
      // Localiza o registro pelo splitId do externalReference (PK confiável,
      // sempre presente). O asaas_payment_id foi gravado no checkout (J47).
      result = await aplicarEventoSplit({
        eventId: evtPayload.eventId,
        type: evtPayload.type,
        splitId: refObra.splitId,
      });
    } else {
      result = await aplicarEventoWebhook(evtPayload);
    }

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
