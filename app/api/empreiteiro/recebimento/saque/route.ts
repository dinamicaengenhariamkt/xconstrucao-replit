import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { solicitarSaque } from "@features/marketplace/saldo-service";

/**
 * POST /api/empreiteiro/recebimento/saque — J49
 * Solicita transferência da subconta para o banco/PIX cadastrado.
 * Guards: empreiteiro, subconta aprovada, valor>0 ≤ saldo, rate-limit.
 */
const bodySchema = z.object({
  valor: z.number().positive(),
});

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Perfil sem acesso" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const ip = getClientIp(request);
  // Saque é sensível — rate-limit apertado (5/min por user, 10/min por IP).
  if (isRateLimited(`saque:${guard.user.id}`, 5, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas solicitações. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`saque.ip:${ip}`, 10, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas solicitações. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Informe um valor de saque válido.", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const result = await solicitarSaque(guard.user.id, parsed.data.valor);

  if (!result.ok) {
    const status =
      result.code === "SPLIT_DESABILITADO"
        ? 403
        : result.code === "SUBCONTA_NAO_APROVADA"
          ? 422
          : result.code === "VALOR_INVALIDO" || result.code === "SALDO_INSUFICIENTE"
            ? 422
            : 500;
    const message =
      result.code === "SPLIT_DESABILITADO"
        ? "Saque indisponível no momento."
        : result.code === "SUBCONTA_NAO_APROVADA"
          ? "Configure e aprove sua conta de recebimento antes de sacar."
          : result.detail ?? "Não foi possível processar o saque. Tente novamente.";
    const r = NextResponse.json({ message, code: result.code }, { status });
    setNoCacheHeaders(r);
    return r;
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "recebimento.saque",
    targetUserId: null,
    payload: { saqueId: result.saque.id, valor: result.saque.valor, status: result.saque.status },
    request,
  });

  const r = NextResponse.json({ ok: true, saque: result.saque });
  setNoCacheHeaders(r);
  return r;
}
