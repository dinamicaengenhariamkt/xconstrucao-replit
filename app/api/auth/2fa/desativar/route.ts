import { NextRequest, NextResponse } from "next/server";
import { requireVerifiedUser, setNoCacheHeaders, isAdminLike } from "@features/auth/api/auth-utils";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { recordAudit } from "@features/auth/api/audit";
import { comparePassword } from "@features/auth/api/auth-service";
import { validarCodigo, validarRecovery } from "@features/auth/api/totp";
import { getTotpByUser, removerTotp } from "@features/auth/api/totp-storage";
import { ADMIN_2FA_OBRIGATORIO } from "@features/auth/api/totp-policy";

/**
 * POST /api/auth/2fa/desativar — desativa o 2FA da conta (J22).
 * Body: { senha: string, codigo: string } — exige senha E código atual (TOTP ou recovery).
 * Bloqueia admins/superadmins quando 2FA é obrigatório por política.
 * Audita `2fa.disabled`.
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const { user } = guard;

  if (isRateLimited(`2fa-disable:${user.id}`, 8, 15 * 60 * 1000)) {
    const r = NextResponse.json(
      { error: "RATE_LIMITED", message: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Política: contas admin não podem ficar sem 2FA quando ele é obrigatório.
  if (ADMIN_2FA_OBRIGATORIO && isAdminLike(user.role)) {
    const r = NextResponse.json(
      { error: "ADMIN_2FA_REQUIRED", message: "Contas administrativas exigem verificação em duas etapas." },
      { status: 403 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const senha = typeof body.senha === "string" ? body.senha : "";
  const codigo = typeof body.codigo === "string" ? body.codigo : "";

  if (!user.password || !(await comparePassword(senha, user.password))) {
    const r = NextResponse.json(
      { error: "INVALID_PASSWORD", message: "Senha incorreta." },
      { status: 401 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const totp = await getTotpByUser(user.id);
  if (!totp?.enabled) {
    const r = NextResponse.json(
      { error: "NOT_ENABLED", message: "A verificação em duas etapas não está ativa." },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Aceita código TOTP atual OU um recovery code válido. Aqui é só validação:
  // a config inteira é removida em seguida (removerTotp), então não há "consumo"
  // de código a persistir — usamos a checagem sem efeito colateral.
  const codigoOk =
    (await validarCodigo(codigo, totp.secret)) || validarRecovery(codigo, totp.recoveryCodes);
  if (!codigoOk) {
    const r = NextResponse.json(
      { error: "INVALID_CODE", message: "Código inválido." },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  await removerTotp(user.id);

  void recordAudit({
    actorId: user.id,
    action: "2fa.disabled",
    targetUserId: user.id,
    payload: { metodo: "totp" },
    request,
  });

  const r = NextResponse.json({ success: true });
  setNoCacheHeaders(r);
  return r;
}
