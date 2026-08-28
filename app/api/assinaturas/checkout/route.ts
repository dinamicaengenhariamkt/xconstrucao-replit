import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { recordAudit } from "@features/auth/api/audit";
import { iniciarCheckout } from "@features/planos/assinatura-service";
import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";
import { db } from "@shared/db/db";
import { planos } from "@shared/db/schema";
import { eq } from "drizzle-orm";

const bodySchema = z.object({
  planoId: z.string().min(1),
  ciclo: z.enum(["mensal", "anual"]).optional(),
  persona: z.enum(["xgestao"]).optional(),
});

/** POST /api/assinaturas/checkout — inicia assinatura (ativa via adapter manual). */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }
  if (parsed.data.persona === "xgestao") {
    const entitlement = await assertXgestaoUser(guard.user.id);
    if (!entitlement) {
      const r = NextResponse.json({ message: "Acesso xgestão não autorizado." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
  } else if (guard.user.role !== "contratante" && guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Plano não aplicável a este perfil." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  const [plano] = await db
    .select({ persona: planos.persona, ativo: planos.ativo })
    .from(planos)
    .where(eq(planos.id, parsed.data.planoId))
    .limit(1);
  if (!plano || !plano.ativo) {
    const r = NextResponse.json({ message: "Plano inválido.", code: "PLANO_INVALIDO" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  let personaCheckout: "empreiteiro" | "contratante" | "xgestao";
  if (plano.persona === "xgestao") {
    const entitlement = await assertXgestaoUser(guard.user.id);
    if (!entitlement) {
      const r = NextResponse.json({ message: "Acesso xgestão não autorizado." }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    personaCheckout = "xgestao";
  } else if (parsed.data.persona === "xgestao") {
    const r = NextResponse.json({ message: "Plano não pertence ao xgestão.", code: "PLANO_INVALIDO" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  } else if (
    (guard.user.role !== "contratante" && guard.user.role !== "empreiteiro") ||
    (plano.persona !== "ambos" && plano.persona !== guard.user.role)
  ) {
    const r = NextResponse.json({ message: "Plano não aplicável a este perfil." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  } else {
    personaCheckout = guard.user.role;
  }
  if (isRateLimited(`assinatura.checkout:user:${guard.user.id}`, 10, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }
  // Header opt-in para modo pendente: usado apenas em testes E2E (NODE_ENV !== production).
  // Faz o ManualGateway retornar kind:"redirect" em vez de ativar imediatamente, permitindo
  // exercitar o ciclo completo checkout → POST /api/webhooks/gateway → ativa.
  const isNonProd = process.env.NODE_ENV !== "production";
  const pendingMode = isNonProd && request.headers.get("x-manual-gateway-pending") === "1";

  const result = await iniciarCheckout({
    userId: guard.user.id,
    planoId: parsed.data.planoId,
    ciclo: parsed.data.ciclo,
    persona: personaCheckout,
    pendingMode,
  });

  if (result.ok === false) {
    if (result.code === "GATEWAY_ERROR") {
      console.error("[checkout] gateway error:", result.detail);
      const r = NextResponse.json({
        message: "Não foi possível abrir o pagamento agora. Tente novamente em instantes.",
        code: result.code,
      }, { status: 502 });
      setNoCacheHeaders(r);
      return r;
    }
    if (result.code === "INTERNAL_ERROR") {
      console.error("[checkout] iniciarCheckout error:", result.detail);
      const r = NextResponse.json({ message: "Erro interno no checkout." }, { status: 500 });
      setNoCacheHeaders(r);
      return r;
    }
    if (result.code === "PERFIL_INCOMPLETO") {
      const r = NextResponse.json({ message: result.detail, code: result.code }, { status: 422 });
      setNoCacheHeaders(r);
      return r;
    }
    const status = result.code === "PLANO_INVALIDO" ? 404 : 409;
    const message = result.code === "PLANO_INVALIDO" ? "Plano inválido." : "Você já assina este plano.";
    const r = NextResponse.json({ message, code: result.code }, { status });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({ actorId: guard.user.id, action: "assinatura.checkout", payload: { planoId: parsed.data.planoId, kind: result.kind }, request });
  const r = NextResponse.json(result, { status: result.kind === "activated" ? 201 : 200 });
  setNoCacheHeaders(r);
  return r;
}
