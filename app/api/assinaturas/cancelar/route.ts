import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { cancelarAssinatura } from "@features/planos/assinatura-service";
import { ehGatewayNaoConfigurado, MENSAGEM_PAGAMENTOS_INDISPONIVEIS } from "@features/planos/gateway";
import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";
import { normalizarMotivoCancelamento } from "@features/xgestao/lib/motivo-cancelamento";
import { executarRotinaDiariaXgestao } from "@features/xgestao/marketing/server/rotina-diaria";
import { getBaseUrl } from "@features/auth/api/auth-utils";
import { db } from "@shared/db/db";
import { xgestaoMembros } from "@shared/db/schema";
import { and, eq } from "drizzle-orm";

// CRM-03 — motivo e comentário opcionais; validados por `normalizarMotivoCancelamento`.
const bodySchema = z.object({
  persona: z.enum(["xgestao"]).optional(),
  motivo: z.unknown().optional(),
  motivoTexto: z.unknown().optional(),
});

async function isActiveXgestaoMember(userId: string): Promise<boolean> {
  const [membership] = await db
    .select({ id: xgestaoMembros.id })
    .from(xgestaoMembros)
    .where(and(eq(xgestaoMembros.userId, userId), eq(xgestaoMembros.status, "ativo")));
  return membership?.id != null;
}

/**
 * POST /api/assinaturas/cancelar — cancela a assinatura ativa do usuário.
 * Marketplace: rebaixa para free na hora. xgestão (XG43): para as próximas
 * cobranças e mantém o acesso até o fim do período pago (`acessoAte`).
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const body = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) {
    const r = NextResponse.json({ message: "Dados inválidos." }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  let persona: "empreiteiro" | "contratante" | "xgestao";
  let motivo: { motivo: string | null; texto: string | null } | undefined;
  if (body.data.persona === "xgestao") {
    const normalizado = normalizarMotivoCancelamento(body.data.motivo, body.data.motivoTexto);
    if (!normalizado.ok) {
      const r = NextResponse.json({ message: normalizado.erro }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    motivo = { motivo: normalizado.motivo, texto: normalizado.texto };
    if (await isActiveXgestaoMember(guard.user.id)) {
      const r = NextResponse.json({ message: "Somente o responsável da empresa pode cancelar o plano xgestão." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    const entitlement = await assertXgestaoUser(guard.user.id);
    if (!entitlement) {
      const r = NextResponse.json({ message: "Acesso xgestão não autorizado." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    persona = "xgestao";
  } else {
    persona = guard.user.role === "empreiteiro" ? "empreiteiro" : "contratante";
  }
  // Marketplace: `motivo` fica indefinido e nada muda.
  let result: Awaited<ReturnType<typeof cancelarAssinatura>>;
  try {
    result = await cancelarAssinatura(guard.user.id, persona, motivo);
  } catch (err) {
    // Gateway desligado (produção sem PAYMENT_GATEWAY válido): 503 como no checkout, não 500.
    if (!ehGatewayNaoConfigurado(err)) throw err;
    const r = NextResponse.json({ code: "GATEWAY_NAO_CONFIGURADO", message: MENSAGEM_PAGAMENTOS_INDISPONIVEIS }, { status: 503 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!result.ok) {
    // REV-09 — troca de plano no meio da chamada ao gateway: tenta de novo em instantes.
    const r = result.code === "TROCA_EM_ANDAMENTO"
      ? NextResponse.json({ code: result.code, message: "Há uma mudança de plano em andamento. Aguarde alguns segundos e tente de novo." }, { status: 409 })
      : NextResponse.json({ message: "Nenhuma assinatura ativa para cancelar." }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }
  // XG52: a confirmação de cancelamento sai na hora (a rotina diária não reenvia).
  if (persona === "xgestao") {
    void executarRotinaDiariaXgestao({ baseUrl: getBaseUrl(request), somenteUsuarios: [guard.user.id], apenasCancelamento: true })
      .catch((err) => console.error("[cancelar] confirmação por e-mail falhou:", err instanceof Error ? err.message : err));
  }
  void recordAudit({ actorId: guard.user.id, action: "assinatura.cancelar", payload: { persona, acessoAte: result.acessoAte ?? null, ...(motivo?.motivo ? { motivo: motivo.motivo } : {}) }, request });
  const r = NextResponse.json({ ok: true, ...(result.acessoAte !== undefined ? { acessoAte: result.acessoAte } : {}) });
  setNoCacheHeaders(r);
  return r;
}
