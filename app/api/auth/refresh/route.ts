import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { eq } from "drizzle-orm";
import { getUserByEmail, getUser, createUser, updateUserPassword, updateUserEmailVerified } from "@features/auth/api/auth-storage";
import {
  verifyRefreshToken,
  createAccessToken,
  rotateRefreshToken
} from "@features/auth/api/auth-service";
import { createAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { db } from "@shared/db/db";
import { sessions } from "@shared/db/schema";

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
      canManageUsers: user.role === "superadmin" ? true : (user.canManageUsers ?? false),
      mustChangePassword: user.mustChangePassword === true,
    };

    // Gerar novo access token
    const newAccessToken = createAccessToken(userData);

    // Rotacionar refresh token (segurança adicional)
    const newRefreshToken = rotateRefreshToken(refreshToken);

    // J23 — multi-role: papéis efetivos (primário + aditivos) no payload do client.
    const { getUserRoles } = await import("@features/auth/api/auth-utils");
    const roles = await getUserRoles(user.id);

    // Criar resposta
    const response = NextResponse.json({
      success: true,
      user: { ...userData, roles },
    });

    if (!newRefreshToken) {
      const r = NextResponse.json({ error: "Refresh token expirado" }, { status: 401 });
      setNoCacheHeaders(r);
      return r;
    }

    // Sessão precisa existir no banco — sessões revogadas não podem ressuscitar.
    const oldHash = createHash("sha256").update(refreshToken).digest("hex");
    const newHash = createHash("sha256").update(newRefreshToken).digest("hex");
    const refreshMaxAgeMs = (payload.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;
    const updated = await db
      .update(sessions)
      .set({
        sessionToken: newHash,
        lastUsedAt: new Date(),
        expires: new Date(Date.now() + refreshMaxAgeMs),
      })
      .where(eq(sessions.sessionToken, oldHash))
      .returning({ id: sessions.id });

    if (updated.length === 0) {
      const r = NextResponse.json(
        { error: "Sessão revogada. Faça login novamente." },
        { status: 401 }
      );
      setNoCacheHeaders(r);
      return r;
    }

    // Configurar headers de segurança e cookies
    setNoCacheHeaders(response);
    createAuthCookies(response, newAccessToken, newRefreshToken, payload.rememberMe);
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
