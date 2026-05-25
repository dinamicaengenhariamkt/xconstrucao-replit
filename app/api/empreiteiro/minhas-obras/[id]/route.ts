import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { findObraAccess } from "@features/obras/api/access";
import { buildMinhaObraDetalheReal } from "@features/empreiteiro/minhas-obras/api/build-detalhe-server";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (
    guard.user.role !== "empreiteiro" &&
    guard.user.role !== "superadmin" &&
    !isAdminLike(guard.user.role)
  ) {
    const r = NextResponse.json({ message: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const detalhe = await buildMinhaObraDetalheReal(id);
  if (!detalhe) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json(detalhe);
  setNoCacheHeaders(r);
  return r;
}
