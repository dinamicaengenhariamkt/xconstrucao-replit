import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { findObraAccess } from "@features/obras/api/access";
import { listMedicoesForObra } from "@/app/api/contratante/medicoes/_shared";

/**
 * XG12 — as atualizações da obra, para quem trabalha nela.
 *
 * O dado existia desde a J06 e ninguém o lia no console: o empreiteiro
 * registrava percentual, descrição e fotos e só o cliente final via o
 * resultado, pelo link público. Esta rota é o que faltava para a aba
 * "Atualizações".
 *
 * Sem `allowDiscovery`: é conteúdo interno da obra, como diário e fotos.
 * Quem não tem vínculo recebe 404, não 403 — não confirmamos a existência
 * da obra para quem não deveria alcançá-la.
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

  const rows = await listMedicoesForObra(id);
  const r = NextResponse.json({ rows });
  setNoCacheHeaders(r);
  return r;
}
