import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { computeHealthMapForObras } from "@features/shared/health/summary-server";
import { findObraAccess } from "@features/obras/api/access";

/**
 * GET /api/obras/[id]/health — saúde REAL de UMA obra (J17), com o mesmo
 * scoping de acesso de `/api/obras/[id]`. Usado nos detalhes de obra
 * (contratante/admin) no lugar de `getMockHealth(obra.id)`.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role }, { allowDiscovery: true });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const map = await computeHealthMapForObras([id]);
  const r = NextResponse.json(map[id] ?? null);
  setNoCacheHeaders(r);
  return r;
}
