import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/server/lib/logger";
import { loginSchema } from "@features/auth/schemas";
import { getUserByEmail } from "@features/auth/api/auth-storage";
import {
  comparePassword,
  createTwoFactorChallengeToken,
} from "@features/auth/api/auth-service";
import { setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { getMaxTentativasLogin } from "@features/admin/platform-settings/server/settings-reader";
import { validateAntiBot } from "@features/auth/api/anti-bot";
import { isTotpEnabled } from "@features/auth/api/totp-storage";
import { montarUserData, emitirSessao } from "@features/auth/api/session-issuer";

const GENERIC_INVALID = "Email ou senha inválidos";

function jsonNoStore(payload: unknown, status: number) {
  const response = NextResponse.json(payload, { status });
  setNoCacheHeaders(response);
  return response;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  // J30 — limite de tentativas configurável (seguranca.maxTentativas); fallback 10.
  const maxTentativas = await getMaxTentativasLogin(10);
  if (isRateLimited(`login:${ip}`, maxTentativas, 15 * 60 * 1000)) {
    return jsonNoStore(
      { error: "Muitas tentativas. Tente novamente em alguns minutos." },
      429
    );
  }

  try {
    const body = await request.json();

    const antiBot = validateAntiBot(body);
    if (!antiBot.ok) {
      return jsonNoStore({ error: GENERIC_INVALID }, 400);
    }

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return jsonNoStore({ error: GENERIC_INVALID }, 400);
    }

    const { email, password } = validation.data;
    const rememberMe = body.rememberMe === true;
    const expectedRole =
      typeof body.expectedRole === "string" ? body.expectedRole : null;

    const user = await getUserByEmail(email);
    if (!user) {
      return jsonNoStore({ error: GENERIC_INVALID }, 401);
    }

    // Conta criada via OAuth (sem senha local): devolvemos a mensagem genérica
    // para não confirmar a existência da conta nem o método de autenticação.
    if (!user.password) {
      return jsonNoStore({ error: GENERIC_INVALID }, 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return jsonNoStore({ error: GENERIC_INVALID }, 401);
    }

    if (user.ativo === false) {
      return jsonNoStore(
        { error: "ACCOUNT_DISABLED", message: "Conta desativada. Contate o administrador." },
        403,
      );
    }

    // Email não verificado: só checamos depois da senha estar correta.
    if (user.emailVerified === null) {
      return jsonNoStore(
        {
          error: "EMAIL_NOT_VERIFIED",
          message: "Por favor, verifique seu email antes de fazer login",
        },
        403
      );
    }

    // Validação de role esperada — não revela que a conta existe
    // sob outro role; devolve a mesma mensagem genérica de credencial.
    // Exceção: super admin pode entrar pela tela de admin (super engloba admin).
    if (expectedRole && expectedRole !== user.role) {
      const superadminEnteringAdmin = expectedRole === "admin" && user.role === "superadmin";
      if (!superadminEnteringAdmin) {
        return jsonNoStore({ error: GENERIC_INVALID }, 401);
      }
    }

    // 2FA (J22): senha correta + conta válida, mas com 2FA ativo → segundo passo.
    // NÃO emitimos sessão aqui; devolvemos um challengeToken curto pro 2º request.
    if (await isTotpEnabled(user.id)) {
      const challengeToken = createTwoFactorChallengeToken(user.id, rememberMe);
      return jsonNoStore({ twoFactorRequired: true, challengeToken }, 200);
    }

    const userData = montarUserData(user);
    return emitirSessao(userData, {
      rememberMe,
      ip,
      userAgent: request.headers.get("user-agent") ?? null,
    });
  } catch (error) {
    void logError("error", "Erro no login", { stack: (error as Error)?.stack, route: "/api/auth/login" });
    return jsonNoStore({ error: "Erro interno do servidor" }, 500);
  }
}
