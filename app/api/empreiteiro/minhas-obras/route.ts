import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders, userHasRole } from "@features/auth/api/auth-utils";
import { listMinhasObrasReal } from "@features/empreiteiro/minhas-obras/api/build-detalhe-server";
import { canAccessObraArea, filterObraPayloadByAreas, findObraAccess } from "@features/obras/api/access";

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
  const rows = await listMinhasObrasReal(guard.user.id, { includeXgestao });
  const obras = await Promise.all(rows.map(async (obra) => {
    const access = await findObraAccess(obra.id, { id: guard.user.id, role: guard.user.role });
    if (!access) return null;
    const filtered = filterObraPayloadByAreas(access, obra);
    if (!canAccessObraArea(access, "diario")) {
      return { ...filtered, imagemUrl: "" };
    }
    return filtered;
  }));
  const r = NextResponse.json(obras.filter(Boolean));
  setNoCacheHeaders(r);
  return r;
}
