import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";

/**
 * GET /api/admin/financeiro — ponto de entrada do módulo financeiro admin.
 *
 * Retorna metadados dos sub-endpoints disponíveis. Os dados detalhados ficam
 * nos sub-endpoints: /dashboard-stats, /receitas-plataforma, /top-clientes, etc.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json({
    endpoints: [
      "/api/admin/financeiro/dashboard-stats",
      "/api/admin/financeiro/receitas-plataforma",
      "/api/admin/financeiro/top-clientes",
      "/api/admin/financeiro/top-empreiteiras",
      "/api/admin/financeiro/adoption",
      "/api/admin/financeiro/obras-atencao",
      "/api/admin/financeiro/payment-evolution",
      "/api/admin/financeiro/portfolio-summary",
      "/api/admin/financeiro/satisfacao",
      "/api/admin/financeiro/status-distribution",
    ],
  });
  setNoCacheHeaders(r);
  return r;
}
