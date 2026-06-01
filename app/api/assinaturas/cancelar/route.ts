import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { cancelarAssinatura } from "@features/planos/assinatura-service";

/** POST /api/assinaturas/cancelar — cancela a assinatura ativa do usuário (rebaixa para free). */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const result = await cancelarAssinatura(guard.user.id);
  if (!result.ok) {
    const r = NextResponse.json({ message: "Nenhuma assinatura ativa para cancelar." }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }
  void recordAudit({ actorId: guard.user.id, action: "assinatura.cancelar", payload: {}, request });
  const r = NextResponse.json({ ok: true });
  setNoCacheHeaders(r);
  return r;
}
