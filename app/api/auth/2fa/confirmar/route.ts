import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { recordAudit } from "@features/auth/api/audit";
import { validarCodigo, gerarRecoveryCodes } from "@features/auth/api/totp";
import { getTotpByUser, ativarTotp } from "@features/auth/api/totp-storage";

/**
 * POST /api/auth/2fa/confirmar — confirma o primeiro código e ativa o 2FA (J22).
 * Body: { codigo: string (6 dígitos) }.
 * Valida o código contra o secret pendente; se OK, ativa, gera os recovery codes
 * (mostrados UMA única vez) e grava só os hashes. Audita `2fa.enabled`.
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { user } = guard;

  const ip = getClientIp(request);
  if (isRateLimited(`2fa-confirm:${user.id}`, 8, 15 * 60 * 1000)) {
    const r = NextResponse.json(
      { error: "RATE_LIMITED", message: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const codigo = typeof body.codigo === "string" ? body.codigo : "";

  const totp = await getTotpByUser(user.id);
  if (!totp) {
    const r = NextResponse.json(
      { error: "NO_SETUP", message: "Inicie a configuração antes de confirmar." },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (totp.enabled) {
    const r = NextResponse.json(
      { error: "ALREADY_ENABLED", message: "A verificação em duas etapas já está ativa." },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  if (!(await validarCodigo(codigo, totp.secret))) {
    const r = NextResponse.json(
      { error: "INVALID_CODE", message: "Código inválido. Verifique o app autenticador." },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const { claros, hashes } = gerarRecoveryCodes();
  await ativarTotp(user.id, hashes);

  void recordAudit({
    actorId: user.id,
    action: "2fa.enabled",
    targetUserId: user.id,
    payload: { metodo: "totp" },
    request,
  });

  // `recoveryCodes` em claro: o cliente DEVE exibir agora; não volta a ser retornado.
  const r = NextResponse.json({ success: true, recoveryCodes: claros });
  setNoCacheHeaders(r);
  return r;
}
