import { NextRequest, NextResponse } from "next/server";
import { verifyTwoFactorChallengeToken } from "@features/auth/api/auth-service";
import { getUser } from "@features/auth/api/auth-storage";
import { setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { recordAudit } from "@features/auth/api/audit";
import { validarCodigo, consumirRecovery } from "@features/auth/api/totp";
import { getTotpByUser, atualizarRecoveryCodes } from "@features/auth/api/totp-storage";
import { montarUserData, emitirSessao } from "@features/auth/api/session-issuer";

const GENERIC_INVALID = "Código inválido. Tente novamente.";

/**
 * POST /api/auth/2fa/verificar — 2º passo do login quando a conta tem 2FA (J22).
 * Body: { challengeToken, codigo }. O challengeToken prova que a senha já passou.
 * Aceita código TOTP atual OU um recovery code (uso único). Só então emite a sessão.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`2fa-verify:${ip}`, 10, 15 * 60 * 1000)) {
    const r = NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const challengeToken = typeof body.challengeToken === "string" ? body.challengeToken : "";
  const codigo = typeof body.codigo === "string" ? body.codigo : "";

  const challenge = verifyTwoFactorChallengeToken(challengeToken);
  if (!challenge) {
    const r = NextResponse.json(
      { error: "CHALLENGE_EXPIRED", message: "Sessão de verificação expirada. Faça login novamente." },
      { status: 401 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Rate-limit por CONTA além do por IP: o espaço de 6 dígitos é forçável e o
  // limite por IP é contornável (proxies, IPs distribuídos). Trava o brute-force
  // mesmo de quem já tem a senha (pré-condição do challenge).
  if (isRateLimited(`2fa-verify-user:${challenge.userId}`, 5, 15 * 60 * 1000)) {
    const r = NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const user = await getUser(challenge.userId);
  const totp = user ? await getTotpByUser(user.id) : undefined;
  // Estados inconsistentes (conta sumiu, 2FA desligado no meio): mensagem genérica.
  if (!user || !totp?.enabled || user.ativo === false || user.emailVerified === null) {
    const r = NextResponse.json({ error: GENERIC_INVALID }, { status: 401 });
    setNoCacheHeaders(r);
    return r;
  }

  // 1) Código TOTP corrente.
  let metodo: "totp" | "recovery" | null = null;
  if (await validarCodigo(codigo, totp.secret)) {
    metodo = "totp";
  } else {
    // 2) Recovery code (uso único): consome e regrava a lista sem o índice usado.
    const idx = consumirRecovery(codigo, totp.recoveryCodes);
    if (idx !== -1) {
      const restantes = totp.recoveryCodes.filter((_, i) => i !== idx);
      await atualizarRecoveryCodes(user.id, restantes);
      metodo = "recovery";
    }
  }

  if (!metodo) {
    // Mesmo status/mensagem do ramo de estado inconsistente acima: não vira oráculo
    // pra distinguir "código errado" de "conta inválida".
    const r = NextResponse.json({ error: GENERIC_INVALID }, { status: 401 });
    setNoCacheHeaders(r);
    return r;
  }

  void recordAudit({
    actorId: user.id,
    action: "2fa.login_verified",
    targetUserId: user.id,
    payload: { metodo },
    request,
  });

  const userData = montarUserData(user);
  return emitirSessao(userData, {
    rememberMe: challenge.rememberMe,
    ip,
    userAgent: request.headers.get("user-agent") ?? null,
  });
}
