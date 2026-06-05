import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getAdminObraDetalhe } from "@features/admin/financeiro/api/obra-detalhe-server";

/** GET /api/admin/financeiro/obras/[id] — detalhe financeiro real da obra (J18). */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const { id } = await params;
  const detalhe = await getAdminObraDetalhe(id);
  if (!detalhe) {
    const r = NextResponse.json({ message: "Obra não encontrada." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  const r = NextResponse.json(detalhe);
  setNoCacheHeaders(r);
  return r;
}
