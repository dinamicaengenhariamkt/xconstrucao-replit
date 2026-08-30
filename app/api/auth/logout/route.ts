import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/server/lib/logger";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { clearAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { db } from "@shared/db/db";
import { sessions } from "@shared/db/schema";
import { buildLogoutRedirect, type LogoutPersona } from "@features/auth/utils/logout-redirect";

function roleToPersona(role: string | undefined): Exclude<LogoutPersona, "xgestao"> {
  if (role === "admin") return "administrador";
  if (role === "empreiteiro") return "empreiteiro";
  return "contratante";
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { persona?: unknown; next?: unknown };
  const requestedXGestao = body.persona === "xgestao";
  const requestedNext = typeof body.next === "string" ? body.next : undefined;
  const fallbackPersona: LogoutPersona = requestedXGestao ? "xgestao" : "contratante";

  try {
    // Captura a role ANTES de limpar cookies para devolver a persona ao cliente.
    // Se não houver token válido, devolvemos persona=null para o client cair no
    // fallback baseado no user.role do store (evita default falso "contratante").
    const cookieHeader = request.headers.get("cookie");
    const token = getAccessTokenFromCookieHeader(cookieHeader);
    const payload = token ? verifyAccessToken(token) : null;
    const persona: LogoutPersona | null = requestedXGestao
      ? "xgestao"
      : payload?.role
        ? roleToPersona(payload.role)
        : null;

    try {
      const refreshMatch = cookieHeader?.match(/(?:^|; )refresh_token=([^;]+)/);
      const refreshToken = refreshMatch ? decodeURIComponent(refreshMatch[1]) : null;
      if (refreshToken) {
        const sessionToken = createHash("sha256").update(refreshToken).digest("hex");
        await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
      }
    } catch (err) {
      void logError("warn", "Falha ao remover sessão no logout", { stack: (err as Error)?.stack, route: "/api/auth/logout" });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logout realizado com sucesso",
      persona,
      redirect: persona ? buildLogoutRedirect(persona, persona === "xgestao" ? requestedNext : undefined) : null,
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
    void logError("error", "Erro no logout", { stack: (error as Error)?.stack, route: "/api/auth/logout" });
    const response = NextResponse.json(
      {
        error: "Erro interno do servidor",
        persona: fallbackPersona,
        redirect: buildLogoutRedirect(fallbackPersona, fallbackPersona === "xgestao" ? requestedNext : undefined),
      },
      { status: 500 }
    );
    setNoCacheHeaders(response);
    return response;
  }
}
