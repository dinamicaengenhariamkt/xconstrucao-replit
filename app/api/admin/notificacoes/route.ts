import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarNotificacoesAdmin } from "@features/admin/comunicacao/api/comunicacao-service";
import type { NotificacaoTipo } from "@features/admin/comunicacao/types";

const TIPOS_VALIDOS: NotificacaoTipo[] = ["lembrete", "alerta", "info", "sucesso"];

/**
 * GET /api/admin/notificacoes — painel REAL de notificações da plataforma (J21).
 * Substitui o mock de features/admin/notifications.
 * Filtros: ?page, ?pageSize, ?tipo, ?status (lida|nao-lida), ?busca.
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
  const tipoParam = url.searchParams.get("tipo");
  const statusParam = url.searchParams.get("status");

  const data = await listarNotificacoesAdmin({
    page: Number(url.searchParams.get("page") ?? 1) || 1,
    pageSize: Number(url.searchParams.get("pageSize") ?? 20) || 20,
    tipo: TIPOS_VALIDOS.includes(tipoParam as NotificacaoTipo) ? (tipoParam as NotificacaoTipo) : undefined,
    status: statusParam === "lida" || statusParam === "nao-lida" ? statusParam : undefined,
    busca: url.searchParams.get("busca") ?? undefined,
  });

  const r = NextResponse.json(data);
  setNoCacheHeaders(r);
  return r;
}
