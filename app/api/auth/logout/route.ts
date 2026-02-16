import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // Criar resposta de sucesso
    const response = NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso"
    });

    // Configurar headers de segurança e limpar cookies
    setNoCacheHeaders(response);
    clearAuthCookies(response);

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
    setNoCacheHeaders(response);
    return response;
  }
}
