import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@features/auth/schemas";
import { getUserByEmail } from "@features/auth/api/auth-storage";
import {
  comparePassword,
  createAccessToken,
  createRefreshToken,
} from "@features/auth/api/auth-service";
import { createAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { validateAntiBot } from "@features/auth/api/anti-bot";

const GENERIC_INVALID = "Email ou senha inválidos";

function jsonNoStore(payload: unknown, status: number) {
  const response = NextResponse.json(payload, { status });
  setNoCacheHeaders(response);
  return response;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`login:${ip}`, 10, 15 * 60 * 1000)) {
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
    if (expectedRole && expectedRole !== user.role) {
      return jsonNoStore({ error: GENERIC_INVALID }, 401);
    }

    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.image,
      avatarUrl: user.avatarUrl,
    };

    const accessToken = createAccessToken(userData);
    const refreshToken = createRefreshToken(user.id, rememberMe);

    const response = NextResponse.json({ success: true, user: userData });
    setNoCacheHeaders(response);
    createAuthCookies(response, accessToken, refreshToken, rememberMe);
    return response;
  } catch (error) {
    console.error("Erro no login:", error);
    return jsonNoStore({ error: "Erro interno do servidor" }, 500);
  }
}
