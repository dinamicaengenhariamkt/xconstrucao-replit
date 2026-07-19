/**
 * POST /api/test/webhooks/force-failed — insere uma linha 'failed' em
 * webhook_delivery_log para permitir testar o retry job em E2E.
 *
 * Disponível APENAS quando E2E_TEST_AUTH=1. Bloqueado em produção.
 *
 * Body:
 *   { "rawBody": string, "eventType"?: string, "gatewayEventId"?: string }
 *
 * Resposta:
 *   201 { id: string }   — row inserida
 *   404 { error: "disabled" } — fora de modo de teste
 */

import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

function isEnabled(): boolean {
  return process.env.E2E_TEST_AUTH === "1";
}

export async function POST(request: NextRequest) {
  if (!isEnabled()) {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    rawBody?: string;
    eventType?: string;
    gatewayEventId?: string;
  };

  const rawBody = body.rawBody ?? "{}";
  const eventType = body.eventType ?? "payment_succeeded";
  const gatewayEventId =
    body.gatewayEventId ??
    `e2e_force_failed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    const result = await db.execute<{ id: string }>(sql`
      INSERT INTO webhook_delivery_log
        (gateway_event_id, event_type, raw_body, headers_json, status, retry_count)
      VALUES
        (${gatewayEventId}, ${eventType}, ${rawBody}, '{}'::jsonb, 'failed', 0)
      ON CONFLICT (gateway_event_id) DO UPDATE
        SET status = 'failed', retry_count = 0
      RETURNING id
    `);
    const id = (result.rows[0] as { id: string } | undefined)?.id;
    if (!id) {
      return NextResponse.json({ error: "insert falhou" }, { status: 500 });
    }
    return NextResponse.json({ id }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
