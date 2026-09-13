import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { findObraAccess } from "@features/obras/api/access";
import { calcularUsoObra } from "@features/obras/api/storage-quota";

/**
 * XG10 — consumo de armazenamento da obra, para a barra de progresso da aba
 * Documentos: "a gente pode colocar um avisozinho ali, como se fosse uma barra
 * de progresso... vai preenchendo até o máximo".
 *
 * Valor real vindo do banco (soma de `user_files` de anexos e fotos), nunca
 * estimado no cliente.
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

  const uso = await calcularUsoObra(id);
  const r = NextResponse.json(uso);
  setNoCacheHeaders(r);
  return r;
}
