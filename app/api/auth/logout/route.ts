import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso"
    });

    // Prevent caching of auth responses
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    // Limpar cookies de autenticação
    // Access token
    response.cookies.set("access_token", "", {
      httpOnly: true,
      secure: true, // Sempre true - Replit usa HTTPS
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expirar imediatamente
    });

    // Refresh token
    response.cookies.set("refresh_token", "", {
      httpOnly: true,
      secure: true, // Sempre true - Replit usa HTTPS
      sameSite: "lax", // Mudado de strict para lax
      path: "/",
      maxAge: 0, // Expirar imediatamente
    });

    // Também limpar cookies antigos do NextAuth (migração)
    response.cookies.set("next-auth.session-token", "", {
      httpOnly: true,
      secure: true, // Sempre true
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    response.cookies.set("next-auth.csrf-token", "", {
      httpOnly: true,
      secure: true, // Sempre true
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;

  } catch (error) {
    console.error("Erro no logout:", error);
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    response.headers.set('Pragma', 'no-cache');
    return response;
  }
}
