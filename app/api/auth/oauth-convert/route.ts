import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createAccessToken,
  createRefreshToken
} from "@features/auth/api/auth-service";
import { createAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";

/**
 * Endpoint para converter sessão NextAuth (OAuth) em tokens JWT custom
 * Chamado após login bem-sucedido com Google OAuth
 */
export async function POST(request: NextRequest) {
  try {
    // Obter sessão NextAuth ativa
    const session = await auth();

    if (!session || !session.user) {
      const response = NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 401 }
      );
      setNoCacheHeaders(response);
      return response;
    }

    const user = session.user;

    // Preparar dados do usuário para JWT
    const userData = {
      id: user.id as string,
      email: user.email as string,
      role: user.role as string,
      name: user.name as string,
      image: user.image,
      avatarUrl: user.image, // OAuth usa image
    };

    // Gerar tokens JWT
    const accessToken = createAccessToken(userData);
    const refreshToken = createRefreshToken(user.id as string, true); // OAuth = remember me true (30 dias)

    // Criar resposta
    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    // Configurar headers de segurança e cookies
    setNoCacheHeaders(response);
    createAuthCookies(response, accessToken, refreshToken, true); // OAuth sempre 30 dias

    return response;

  } catch (error) {
    console.error("Erro ao converter sessão OAuth:", error);
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    setNoCacheHeaders(response);
    return response;
  }
}
