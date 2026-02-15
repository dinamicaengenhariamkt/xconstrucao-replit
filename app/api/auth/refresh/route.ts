import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import {
  verifyRefreshToken,
  createAccessToken,
  rotateRefreshToken
} from "@/server/auth";

export async function POST(request: NextRequest) {
  try {
    // Ler refresh token do cookie
    const refreshToken = request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      const response = NextResponse.json(
        { error: "Refresh token não encontrado" },
        { status: 401 }
      );
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      return response;
    }

    // Validar refresh token
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      const response = NextResponse.json(
        { error: "Refresh token inválido ou expirado" },
        { status: 401 }
      );
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
      return response;
    }

    // Buscar usuário no banco
    const user = await storage.getUser(payload.sub);

    if (!user) {
      const response = NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      response.headers.set('Pragma', 'no-cache');
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

    // Prevent caching of auth responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Setar novo access token
    response.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: true, // Sempre true - Replit usa HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60, // 15 minutos
    });

    // Rotacionar refresh token se foi gerado novo
    if (newRefreshToken) {
      const refreshMaxAge = payload.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      response.cookies.set("refresh_token", newRefreshToken, {
        httpOnly: true,
        secure: true, // Sempre true - Replit usa HTTPS
        sameSite: "lax", // Mudado de strict para lax
        path: "/",
        maxAge: refreshMaxAge,
      });
    }

    return response;

  } catch (error) {
    console.error("Erro no refresh:", error);
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }
}
