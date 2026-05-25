import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { contarNaoLidas, listarNotificacoes } from "@features/notificacoes/service";

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50) || 50, 1), 200);

  const [rows, naoLidas] = await Promise.all([
    listarNotificacoes(guard.user.id, limit),
    contarNaoLidas(guard.user.id),
  ]);

  const r = NextResponse.json({
    items: rows.map((n) => ({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      descricao: n.descricao,
      href: n.href ?? "",
      lida: n.lida,
      criadoEm: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
    })),
    naoLidas,
  });
  setNoCacheHeaders(r);
  return r;
}
