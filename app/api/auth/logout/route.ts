import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";

function roleToPersona(role: string | undefined): "contratante" | "empreiteiro" | "administrador" {
  if (role === "admin") return "administrador";
  if (role === "empreiteiro") return "empreiteiro";
  return "contratante";
}

export async function POST(request: NextRequest) {
  try {
    // Captura a role ANTES de limpar cookies para devolver a persona ao cliente.
    // Se não houver token válido, devolvemos persona=null para o client cair no
    // fallback baseado no user.role do store (evita default falso "contratante").
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;
    const persona = payload?.role ? roleToPersona(payload.role) : null;

    const response = NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
      persona,
      redirect: persona ? `/login?perfil=${persona}` : null,
    });

    setNoCacheHeaders(response);
    clearAuthCookies(response);

    response.cookies.set("next-auth.session-token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    response.cookies.set("next-auth.csrf-token", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("Erro no logout:", error);
    const response = NextResponse.json(
      { error: "Erro interno do servidor", persona: "contratante", redirect: "/login?perfil=contratante" },
      { status: 500 }
    );
    setNoCacheHeaders(response);
    return response;
  }
}
