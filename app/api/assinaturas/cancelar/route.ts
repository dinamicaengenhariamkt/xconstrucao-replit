import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { cancelarAssinatura } from "@features/planos/assinatura-service";
import { assertXgestaoUser } from "@features/xgestao/lib/entitlement";

const bodySchema = z.object({ persona: z.enum(["xgestao"]).optional() });

/** POST /api/assinaturas/cancelar — cancela a assinatura ativa do usuário (rebaixa para free). */
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
  if (body.data.persona === "xgestao") {
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
  const result = await cancelarAssinatura(guard.user.id, persona);
  if (!result.ok) {
    const r = NextResponse.json({ message: "Nenhuma assinatura ativa para cancelar." }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }
  void recordAudit({ actorId: guard.user.id, action: "assinatura.cancelar", payload: { persona }, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
