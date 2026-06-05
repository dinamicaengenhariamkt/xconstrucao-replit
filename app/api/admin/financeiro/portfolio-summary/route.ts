import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getAdminPortfolioSummary } from "@features/admin/financeiro/api/portfolio-summary-server";

/** GET /api/admin/financeiro/portfolio-summary — saúde + lucro de todo o portfólio (J18). */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json(await getAdminPortfolioSummary());
  setNoCacheHeaders(r);
  return r;
}
