/**
 * POST /api/test/webhooks/asaas — simulação local de webhooks ASAS para testes.
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1. Bloqueado em produção.
 *
 * Permite testar o fluxo completo de webhook (ativação, reativação, cancelamento,
 * inadimplência) sem depender de credenciais ASAS nem de URL pública acessível.
 * Chama diretamente o mesmo pipeline de `aplicarEventoWebhook` que o handler real
 * usa após o parseWebhook do adapter ASAS.
 *
 * ── Body aceito ─────────────────────────────────────────────────────────────
 *
 *   {
 *     // Obrigatórios:
 *     "type": "payment_succeeded" | "payment_failed" | "subscription_canceled"
 *             | "subscription_activated" | "ignored",
 *
 *     // Opcionais (omitidos → undefined):
 *     "eventId":                 string,   // default: "sim-<timestamp>-<random>"
 *     "gatewaySubscriptionId":   string,   // id da assinatura no ASAS
 *     "gatewayCustomerId":       string,   // id do customer no ASAS
 *     "externalReference":       string,   // "xconstrucao|userId|planoId|ciclo"
 *     "valor":                   number    // valor em R$ (ex: 99.90)
 *   }
 *
 * ── Resposta ────────────────────────────────────────────────────────────────
 *
 *   200 { received: true, processed: boolean }   — mesmo formato do handler real
 *   400 { error: string }                        — body inválido ou type ausente
 *   404 { error: "disabled" }                    — fora de modo de teste
 *
 * ── Exemplos de uso (curl) ───────────────────────────────────────────────────
 *
 *   # Primeiro pagamento: cria assinatura via externalReference
 *   curl -X POST http://localhost:5000/api/test/webhooks/asaas \
 *     -H 'Content-Type: application/json' \
 *     -d '{"type":"payment_succeeded","externalReference":"xconstrucao|USER_ID|PLANO_ID|mensal","valor":99.9}'
 *
 *   # Cancelamento de assinatura existente (por gatewaySubscriptionId)
 *   curl -X POST http://localhost:5000/api/test/webhooks/asaas \
 *     -H 'Content-Type: application/json' \
 *     -d '{"type":"subscription_canceled","gatewaySubscriptionId":"sub_def456"}'
 *
 *   # Teste de idempotência: enviar o mesmo eventId duas vezes
 *   curl -X POST http://localhost:5000/api/test/webhooks/asaas \
 *     -H 'Content-Type: application/json' \
 *     -d '{"type":"subscription_activated","eventId":"meu-evento-fixo","gatewaySubscriptionId":"sub_xyz"}'
 */

import { NextRequest, NextResponse } from "next/server";
import { aplicarEventoWebhook } from "@features/planos/assinatura-service";

function isEnabled(): boolean {
  // Hard deny in production regardless of any test env vars.
  if (process.env.NODE_ENV === "production") return false;
  return process.env.E2E_TEST_AUTH === "1";
}

function generateEventId(): string {
  return `sim-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const VALID_TYPES = new Set([
  "payment_succeeded",
  "payment_failed",
  "subscription_canceled",
  "subscription_activated",
  "ignored",
]);

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido." }, { status: 400 });
  }

  const type = typeof body.type === "string" ? body.type : undefined;
  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json(
      {
        error: `Campo 'type' obrigatório. Valores aceitos: ${[...VALID_TYPES].join(", ")}.`,
      },
      { status: 400 },
    );
  }

  if (type === "ignored") {
    return NextResponse.json({ received: true, processed: false });
  }

  const eventId =
    typeof body.eventId === "string" && body.eventId.trim()
      ? body.eventId.trim()
      : generateEventId();

  const gatewaySubscriptionId =
    typeof body.gatewaySubscriptionId === "string" ? body.gatewaySubscriptionId : undefined;
  const gatewayCustomerId =
    typeof body.gatewayCustomerId === "string" ? body.gatewayCustomerId : undefined;
  const externalReference =
    typeof body.externalReference === "string" ? body.externalReference : undefined;
  const valor = typeof body.valor === "number" ? body.valor : undefined;

  try {
    const result = await aplicarEventoWebhook({
      eventId,
      type,
      gatewaySubscriptionId,
      gatewayCustomerId,
      externalReference,
      valor,
    });
    return NextResponse.json({ received: true, processed: result.processed });
  } catch (err) {
    console.error("[test/webhooks/asaas] falha ao aplicar evento:", err);
    return NextResponse.json({ error: "PROCESSING_ERROR" }, { status: 500 });
  }
}
