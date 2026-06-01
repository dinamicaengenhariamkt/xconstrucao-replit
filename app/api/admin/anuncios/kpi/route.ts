import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getAnuncioKpi } from "@features/anuncios/anuncios-service";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const hoje = new Date().toISOString().slice(0, 10);
  const r = NextResponse.json(await getAnuncioKpi(hoje));
  setNoCacheHeaders(r);
  return r;
}
