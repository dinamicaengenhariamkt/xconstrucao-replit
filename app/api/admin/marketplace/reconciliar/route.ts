import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { reconciliarSplitsPendentes } from "@features/marketplace/reconciliacao-split-job";

/**
 * POST /api/admin/marketplace/reconciliar — J50
 * Dispara manualmente a reconciliação de `pagamentos_split` presos em `pendente`.
 * Requer admin/superadmin. Idempotente. No-op se MARKETPLACE_SPLIT off.
 *
 * Body (opcional): { "limit": 50 } — max splits por execução (default 50, max 200).
 */
export async function POST(request: NextRequest) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  let limit = 50;
  const body = await request.json().catch(() => ({}));
  if (typeof body?.limit === "number" && body.limit > 0 && body.limit <= 200) {
    limit = body.limit;
  }

  const result = await reconciliarSplitsPendentes(limit);

  if (!result.ok) {
    return NextResponse.json(
      { message: "Erro ao reconciliar pagamentos de split", error: result.error },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    verificados: result.verificados,
    recuperados: result.recuperados,
    falhas: result.falhas,
    runAt: result.runAt,
  });
}
