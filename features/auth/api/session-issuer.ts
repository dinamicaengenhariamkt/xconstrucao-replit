// J22 — emissão de sessão compartilhada entre o login normal e o 2º passo do 2FA.
// Extraído do route de login pra que /api/auth/2fa/verificar emita EXATAMENTE a
// mesma sessão (mesmos cookies, mesmo registro em `sessions`) após o 2º fator.
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createAccessToken, createRefreshToken } from "@features/auth/api/auth-service";
import { createAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { updateUserLastLogin } from "@features/auth/api/auth-storage";
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
  /** XG06 — "global" | "xgestao". Ausente em tokens antigos ⇒ lido como "global". */
  adminEscopo: string;
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
    // XG06 — superadmin nunca é restringível; ausência lê como "global".
    adminEscopo: user.role === "superadmin" ? "global" : (user.adminEscopo ?? "global"),
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

  // J30 — timeout de sessão por inatividade (seguranca.timeout, minutos). Quando
  // setado, encurta a janela de refresh/sessão; ausente → mantém 7/30 dias.
  const { getSessionTimeoutMinutes } = await import(
    "@features/admin/platform-settings/server/settings-reader"
  );
  const timeoutMin = await getSessionTimeoutMinutes().catch(() => null);
  const timeoutSeconds = timeoutMin ? timeoutMin * 60 : null;

  try {
    const sessionToken = createHash("sha256").update(refreshToken).digest("hex");
    const refreshMaxAgeMs = timeoutSeconds
      ? timeoutSeconds * 1000
      : (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000;
    await db.insert(sessions).values({
      sessionToken,
      userId: userData.id,
      expires: new Date(Date.now() + refreshMaxAgeMs),
      userAgent,
      ip,
      lastUsedAt: new Date(),
    });
    // J29 — registra o último login (cobre login normal e 2º passo do 2FA, que
    // chamam emitirSessao). Best-effort: falha aqui não impede a sessão.
    await updateUserLastLogin(userData.id, new Date());
  } catch (err) {
    console.error("Falha ao registrar sessão:", err);
  }

  // J23 — multi-role: anexa os papéis efetivos (primário + aditivos) ao payload do
  // client. Não vai no token (que carrega só o papel primário). Best-effort.
  let roles: string[] = [userData.role];
  try {
    const { getUserRoles } = await import("@features/auth/api/auth-utils");
    roles = await getUserRoles(userData.id);
  } catch (err) {
    console.error("Falha ao carregar papéis do usuário:", err);
  }

  const response = NextResponse.json({ success: true, user: { ...userData, roles } });
  setNoCacheHeaders(response);
  createAuthCookies(response, accessToken, refreshToken, rememberMe, timeoutSeconds);
  return response;
}
