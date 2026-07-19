import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { retryPendingWebhookEvents } from "@features/planos/webhook-retry-job";

/**
 * POST /api/admin/webhooks/retry-pending
 *
 * Dispara manualmente o reprocessamento de webhooks com status
 * 'pending' ou 'failed' e menos de 5 tentativas, criados nas últimas 24h.
 *
 * Requer role admin ou superadmin.
 * Idempotente — pode ser chamado quantas vezes for necessário.
 *
 * Body (opcional):
 *   { "limit": 50 }  — max eventos por execução (default 50, max 200)
 */
export async function POST(request: NextRequest) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  let limit = 50;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.limit === "number" && body.limit > 0 && body.limit <= 200) {
      limit = body.limit;
    }
  } catch {
  }

  const result = await retryPendingWebhookEvents(null, limit);

  if (!result.ok) {
    return NextResponse.json(
      { message: "Erro ao reprocessar webhooks pendentes", error: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    retried: result.retried,
    succeeded: result.succeeded,
    failed: result.failed,
    runAt: result.runAt,
  });
}
