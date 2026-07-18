import { NextRequest, NextResponse } from "next/server";
import { getPaymentGateway } from "@features/planos/gateway";
import { aplicarEventoWebhook } from "@features/planos/assinatura-service";

/**
 * POST /api/webhooks/gateway — recebe eventos do gateway de pagamento (J11).
 *
 * Público por natureza (o gateway chama). A AUTENTICIDADE é validada dentro de
 * `gateway.parseWebhook` (verificação de assinatura do payload no adapter real).
 * O processamento é IDEMPOTENTE: o mesmo eventId nunca é aplicado duas vezes
 * (índice único em assinatura_eventos.gateway_event_id).
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text().catch(() => "");
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k] = v;
  });

  let evt;
  try {
    evt = await getPaymentGateway().parseWebhook(rawBody, headers);
  } catch (err) {
    console.error("[webhooks/gateway] assinatura inválida ou payload malformado:", err);
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 400 });
  }

  if (evt.type === "ignored") {
    return NextResponse.json({ received: true, processed: false });
  }

  try {
    const result = await aplicarEventoWebhook({
      eventId: evt.eventId,
      type: evt.type,
      gatewaySubscriptionId: evt.gatewaySubscriptionId,
      externalReference: evt.externalReference,
      valor: evt.valor,
    });
    return NextResponse.json({ received: true, processed: result.processed });
  } catch (err) {
    console.error("[webhooks/gateway] falha ao aplicar evento:", err);
    return NextResponse.json({ error: "PROCESSING_ERROR" }, { status: 500 });
  }
}
