import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarThreadsAdmin } from "@features/admin/comunicacao/api/comunicacao-service";

/**
 * GET /api/admin/chat/threads — lista paginada de threads de chat (J21).
 * READ-ONLY: observabilidade admin sobre a comunicação contratante↔empreiteiro.
 * Filtros: ?page, ?pageSize, ?busca (obra/participante), ?somenteNaoRespondidas.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const url = new URL(request.url);
  const data = await listarThreadsAdmin({
    page: Number(url.searchParams.get("page") ?? 1) || 1,
    pageSize: Number(url.searchParams.get("pageSize") ?? 20) || 20,
    busca: url.searchParams.get("busca") ?? undefined,
    somenteNaoRespondidas: url.searchParams.get("somenteNaoRespondidas") === "true",
  });

  const r = NextResponse.json(data);
  setNoCacheHeaders(r);
  return r;
}
