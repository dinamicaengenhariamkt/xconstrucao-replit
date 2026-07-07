import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { findObraAccess } from "@features/obras/api/access";
import { listarDisputasDaObra } from "@features/disputas/disputas-service";

/**
 * GET /api/obras/[id]/disputas — disputas de UMA obra para as partes (J10).
 * Backend de disputas já estava pronto; faltava só esta leitura filtrada por
 * obra para a aba no detalhe. Ownership via `findObraAccess` (contratante,
 * empreiteiro vinculado ou admin). Notas internas NÃO são expostas aqui.
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id } = await ctx.params;
  const access = await findObraAccess(id, { id: guard.user.id, role: guard.user.role });
  if (!access) {
    const r = NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const rows = await listarDisputasDaObra(id, guard.user.id);
  const r = NextResponse.json(rows);
  setNoCacheHeaders(r);
  return r;
}
