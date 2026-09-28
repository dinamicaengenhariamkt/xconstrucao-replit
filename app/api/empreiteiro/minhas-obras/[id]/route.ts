import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { canAccessObraArea, filterObraPayloadByAreas, findObraAccess } from "@features/obras/api/access";
import { buildMinhaObraDetalheReal } from "@features/empreiteiro/minhas-obras/api/build-detalhe-server";
import type { AreasPermitidas, CategoriasFinanceiroPermitidas } from "@features/xgestao/equipe/permissions";

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
  const filtered = filterObraPayloadByAreas(access, detalhe);
  if (!canAccessObraArea(access, "equipe")) {
    delete (filtered as Partial<typeof detalhe>).documentos;
  }
  if (!canAccessObraArea(access, "diario")) {
    (filtered as Partial<typeof detalhe>).imagemUrl = "";
  }
  const payload = access.xgestaoPermission
    ? {
        ...filtered,
        permissoesXgestao: {
          areasPermitidas: (access.xgestaoAreasPermitidas ?? null) as AreasPermitidas,
          categoriasFinanceiroPermitidas:
            (access.xgestaoCategoriasFinanceiroPermitidas ?? null) as CategoriasFinanceiroPermitidas,
        },
      }
    : filtered;
  const r = NextResponse.json(payload);
  setNoCacheHeaders(r);
  return r;
}
