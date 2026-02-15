import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  createAccessToken,
  createRefreshToken
} from "@/server/auth";

/**
 * Endpoint para converter sessão NextAuth (OAuth) em tokens JWT custom
 * Chamado após login bem-sucedido com Google OAuth
 */
export async function POST(request: NextRequest) {
  try {
    // Obter sessão NextAuth ativa
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 401 }
      );
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

    // Setar cookies HTTP-only com tokens JWT
    // Access Token (15 minutos)
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: true, // Sempre true - Replit usa HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });

    // Refresh Token (30 dias para OAuth)
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: true, // Sempre true - Replit usa HTTPS
      sameSite: "lax", // Mudado de strict para lax
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error("Erro ao converter sessão OAuth:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
