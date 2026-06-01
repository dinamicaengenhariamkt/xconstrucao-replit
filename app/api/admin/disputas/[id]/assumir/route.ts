import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { assumirDisputa } from "@features/disputas/disputas-service";

/** POST /api/admin/disputas/[id]/assumir — admin assume a mediação (aberta → em_analise). */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const { id } = await ctx.params;
  const updated = await assumirDisputa({ id, adminId: guard.user.id });
  if (!updated) {
    const r = NextResponse.json({ message: "Disputa não encontrada ou já assumida." }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }
  void recordAudit({ actorId: guard.user.id, action: "disputas.assumir", payload: { disputaId: id }, request });
  const r = NextResponse.json(updated);
  setNoCacheHeaders(r);
  return r;
}
