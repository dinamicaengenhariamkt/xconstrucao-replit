import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getEntradas } from "@features/admin/financeiro/api/caixa-service";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const q = new URL(request.url).searchParams;
  const r = NextResponse.json(
    await getEntradas(q.get("periodo"), Date.now(), { from: q.get("from"), to: q.get("to") }),
  );
  setNoCacheHeaders(r);
  return r;
}
