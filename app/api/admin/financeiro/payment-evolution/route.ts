import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getPaymentEvolution } from "@features/admin/financeiro/api/caixa-service";

/** GET /api/admin/financeiro/payment-evolution?periodo= — evolução medições vs pagamentos (J18). */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const periodo = request.nextUrl.searchParams.get("periodo");
  const r = NextResponse.json(await getPaymentEvolution(periodo, Date.now()));
  setNoCacheHeaders(r);
  return r;
}
