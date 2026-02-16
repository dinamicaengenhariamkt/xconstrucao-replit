import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUser, createUser, updateUserPassword, updateUserEmailVerified } from "@features/auth/api/auth-storage";
import {
  verifyRefreshToken,
  createAccessToken,
  rotateRefreshToken
} from "@features/auth/api/auth-service";
import { createAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // Ler refresh token do cookie
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      const response = NextResponse.json(
        { error: "Refresh token não encontrado" },
        { status: 401 }
      );
      setNoCacheHeaders(response);
      return response;
    }

    // Validar refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      const response = NextResponse.json(
        { error: "Refresh token inválido ou expirado" },
        { status: 401 }
      );
      setNoCacheHeaders(response);
      return response;
    }

    // Buscar usuário no banco
    const user = await getUser(payload.sub);

    if (!user) {
      const response = NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
      setNoCacheHeaders(response);
      return response;
    }

    // Preparar dados do usuário
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      image: user.image,
      avatarUrl: user.avatarUrl,
    };

    // Gerar novo access token
    const newAccessToken = createAccessToken(userData);

    // Rotacionar refresh token (segurança adicional)
    const newRefreshToken = rotateRefreshToken(refreshToken);

    // Criar resposta
    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    // Configurar headers de segurança e cookies
    setNoCacheHeaders(response);
    if (newRefreshToken) {
      createAuthCookies(response, newAccessToken, newRefreshToken, payload.rememberMe);
    }

    return response;

  } catch (error) {
    console.error("Erro no refresh:", error);
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    setNoCacheHeaders(response);
    return response;
  }
}
