import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "./auth-service";
import { getUser } from "./auth-storage";
import type { User } from "@shared/db/schema";

/**
 * Resultado padronizado para guards de autenticação em rotas API.
 * - `error: NextResponse` quando o usuário não pode prosseguir (401/403)
 * - `user: User`           quando está autenticado e com email verificado
 */
type AuthGuardResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse };

/**
 * Garante que a request veio de um usuário autenticado COM email verificado.
 * Use em endpoints downstream (criar obra, candidatar-se, etc.) que devem ser
 * bloqueados até a verificação do email.
 *
 * - 401 se token inválido / ausente
 * - 403 com `EMAIL_NOT_VERIFIED` se email ainda não foi confirmado
 * - 404 se o user_id do token não existe mais no banco
 */
export async function requireVerifiedUser(request: NextRequest): Promise<AuthGuardResult> {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;

  if (!payload?.sub) {
    const response = NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    setNoCacheHeaders(response);
    return { user: null, error: response };
  }

  const user = await getUser(payload.sub);
  if (!user) {
    const response = NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    setNoCacheHeaders(response);
    return { user: null, error: response };
  }

  if (!user.emailVerified) {
    const response = NextResponse.json(
      {
        error: "EMAIL_NOT_VERIFIED",
        message: "Verifique seu email para liberar esta ação.",
      },
      { status: 403 }
    );
    setNoCacheHeaders(response);
    return { user: null, error: response };
  }

  return { user, error: null };
}

/**
 * Cria e configura cookies de autenticação (access_token + refresh_token)
 */
export function createAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean
): void {
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  const refreshMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
  response.cookies.set("refresh_token", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: refreshMaxAge,
  });
}

/**
 * Limpa os cookies de autenticação (access_token + refresh_token)
 */
export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set("refresh_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Configura headers de no-cache para respostas de autenticação
 * Previne caching de endpoints sensíveis
 */
export function setNoCacheHeaders(response: NextResponse): void {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
}

/**
 * Obtém a URL base da aplicação
 * Usa NEXTAUTH_URL do env ou constrói a partir da request
 */
export function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`;
}
