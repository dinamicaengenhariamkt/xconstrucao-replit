// J22 — emissão de sessão compartilhada entre o login normal e o 2º passo do 2FA.
// Extraído do route de login pra que /api/auth/2fa/verificar emita EXATAMENTE a
// mesma sessão (mesmos cookies, mesmo registro em `sessions`) após o 2º fator.
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAccessToken, createRefreshToken } from "@features/auth/api/auth-service";
import { createAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { db } from "@shared/db/db";
import { sessions, type User } from "@shared/db/schema";

export interface SessionUserData {
  id: string;
  email: string;
  role: string;
  name: string;
  image: string | null;
  avatarUrl: string | null;
  canManageUsers: boolean;
  mustChangePassword: boolean;
}

/** Monta o payload de sessão a partir da linha `users` (fonte única de verdade). */
export function montarUserData(user: User): SessionUserData {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    image: user.image,
    avatarUrl: user.avatarUrl,
    canManageUsers: user.role === "superadmin" ? true : (user.canManageUsers ?? false),
    mustChangePassword: user.mustChangePassword === true,
  };
}

/**
 * Emite a sessão completa: cria access/refresh tokens, registra a sessão no banco
 * e devolve a NextResponse já com os cookies setados e headers no-store.
 * `ip`/`userAgent` vêm do request original.
 */
export async function emitirSessao(
  userData: SessionUserData,
  opts: { rememberMe: boolean; ip: string; userAgent: string | null },
): Promise<NextResponse> {
  const { rememberMe, ip, userAgent } = opts;
  const accessToken = createAccessToken(userData);
  const refreshToken = createRefreshToken(userData.id, rememberMe);

  try {
    const sessionToken = createHash("sha256").update(refreshToken).digest("hex");
    const refreshMaxAgeMs = (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;
    await db.insert(sessions).values({
      sessionToken,
      userId: userData.id,
      expires: new Date(Date.now() + refreshMaxAgeMs),
      userAgent,
      ip,
      lastUsedAt: new Date(),
    });
  } catch (err) {
    console.error("Falha ao registrar sessão:", err);
  }

  const response = NextResponse.json({ success: true, user: userData });
  setNoCacheHeaders(response);
  createAuthCookies(response, accessToken, refreshToken, rememberMe);
  return response;
}
