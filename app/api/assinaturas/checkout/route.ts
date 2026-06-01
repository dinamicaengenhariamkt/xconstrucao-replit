import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { recordAudit } from "@features/auth/api/audit";
import { iniciarCheckout } from "@features/planos/assinatura-service";

const bodySchema = z.object({
  planoId: z.string().min(1),
  ciclo: z.enum(["mensal", "anual"]).optional(),
});

/** POST /api/assinaturas/checkout — inicia assinatura (ativa via adapter manual). */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "contratante" && guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Plano não aplicável a este perfil." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`assinatura.checkout:user:${guard.user.id}`, 10, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const result = await iniciarCheckout({ userId: guard.user.id, planoId: parsed.data.planoId, ciclo: parsed.data.ciclo });
  if (!result.ok) {
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
