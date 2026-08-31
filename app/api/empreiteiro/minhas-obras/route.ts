import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders, userHasRole } from "@features/auth/api/auth-utils";
import { listMinhasObrasReal } from "@features/empreiteiro/minhas-obras/api/build-detalhe-server";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ message: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const includeXgestao =
    guard.user.role === "superadmin" ||
    await userHasRole(guard.user.id, "xgestao");
  const obras = await listMinhasObrasReal(guard.user.id, { includeXgestao });
  const r = NextResponse.json(obras);
  setNoCacheHeaders(r);
  return r;
}
