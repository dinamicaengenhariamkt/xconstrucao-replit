import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { obterThreadDetalheAdmin } from "@features/admin/comunicacao/api/comunicacao-service";
import { recordAudit } from "@features/auth/api/audit";

/**
 * GET /api/admin/chat/threads/[id]/mensagens — histórico READ-ONLY de uma thread (J21).
 * Sem rota de POST: o admin NÃO escreve na thread das partes.
 * Cada abertura registra `admin.chat.read` em audit_logs (trilha de auditoria).
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!isAdminLike(guard.user.role)) {
    const r = NextResponse.json({ message: "Apenas administradores." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await ctx.params;
  const detalhe = await obterThreadDetalheAdmin(id);
  if (!detalhe) {
    const r = NextResponse.json({ message: "Thread não encontrada." }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  // Trilha de auditoria: quem leu, qual thread, quando (e contexto da obra/partes).
  void recordAudit({
    actorId: guard.actor?.id ?? guard.user.id,
    action: "admin.chat.read",
    targetUserId: detalhe.thread.contratanteUserId,
    payload: {
      threadId: detalhe.thread.threadId,
      obraId: detalhe.thread.obraId,
      empreiteiroUserId: detalhe.thread.empreiteiroUserId,
      totalMensagens: detalhe.thread.totalMensagens,
    },
    request,
  });

  const r = NextResponse.json(detalhe);
  setNoCacheHeaders(r);
  return r;
}
