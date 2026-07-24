import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getSatisfactionMetrics } from "@features/admin/financeiro/api/caixa-service";

/**
 * GET /api/admin/financeiro/satisfacao — J20.
 * NPS/CSAT reais agregados. Responde 204 (sem corpo) quando não há respostas na
 * janela — a UI trata como "dados pendentes" e não renderiza números falsos.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const metrics = await getSatisfactionMetrics(Date.now());
  if (!metrics) {
    const r = new NextResponse(null, { status: 204 });
    setNoCacheHeaders(r);
    return r;
  }

  const r = NextResponse.json(metrics);
  setNoCacheHeaders(r);
  return r;
}
