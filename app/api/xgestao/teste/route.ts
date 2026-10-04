import { NextRequest } from "next/server";
import { recordAudit } from "@features/auth/api/audit";
import { iniciarTeste, TesteError } from "@features/xgestao/teste/server/teste-service";
import { jsonSemCache, requireResponsavelPlanoXgestao } from "@features/xgestao/teste/server/guard";

const MENSAGENS: Record<TesteError["code"], { status: number; message: string }> = {
  JA_USOU_TESTE: { status: 409, message: "O teste grátis já foi usado nesta conta." },
  JA_ASSINANTE: { status: 409, message: "Sua conta já tem um plano ativo." },
  PLANO_INDISPONIVEL: { status: 503, message: "Teste grátis indisponível no momento." },
};

/** POST /api/xgestao/teste — XG35: inicia o teste grátis (uma vez por conta). */
export async function POST(request: NextRequest) {
  const ctx = await requireResponsavelPlanoXgestao(request);
  if (ctx.error) return ctx.error;
  try {
    const { fimTeste } = await iniciarTeste(ctx.userId);
    await recordAudit({
      actorId: ctx.userId,
      action: "xgestao.teste.iniciar",
      targetUserId: ctx.userId,
      payload: { fimTeste },
      request,
    });
    return jsonSemCache({ ok: true, fimTeste }, 201);
  } catch (err) {
    if (err instanceof TesteError) {
      const { status, message } = MENSAGENS[err.code];
      return jsonSemCache({ code: err.code, message }, status);
    }
    // Corrida perdida no índice único `(user_id, persona) WHERE status = 'ativa'`.
    if ((err as { code?: string })?.code === "23505") {
      return jsonSemCache({ code: "JA_ASSINANTE", message: MENSAGENS.JA_ASSINANTE.message }, 409);
    }
    throw err;
  }
}
