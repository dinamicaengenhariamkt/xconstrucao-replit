import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarAssinantesAdmin } from "@features/planos/assinatura-service";

/** GET /api/admin/planos/assinantes?perfil=... — lista de assinantes por persona. */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const perfil = new URL(request.url).searchParams.get("perfil") === "empreiteiro" ? "empreiteiro" : "contratante";
  const r = NextResponse.json(await listarAssinantesAdmin(perfil));
  setNoCacheHeaders(r);
  return r;
}
