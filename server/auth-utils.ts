import { NextResponse } from "next/server";

/**
 * Cria e configura cookies de autenticação (access_token + refresh_token)
 * @param response - NextResponse onde os cookies serão configurados
 * @param accessToken - JWT access token (15 minutos)
 * @param refreshToken - JWT refresh token (7 ou 30 dias)
 * @param rememberMe - Se true, refresh token dura 30 dias; se false, 7 dias
 */
export function createAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  rememberMe: boolean
): void {
  // Access token (15 minutos)
  response.cookies.set("access_token", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 minutos em segundos
  });

  // Refresh token (7 ou 30 dias baseado em rememberMe)
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
 * @param response - NextResponse onde os cookies serão limpos
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
 * @param response - NextResponse onde os headers serão configurados
 */
export function setNoCacheHeaders(response: NextResponse): void {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
}

/**
 * Obtém a URL base da aplicação
 * Usa NEXTAUTH_URL do env ou constrói a partir da request
 * @param request - Request object da rota API
 * @returns URL base (ex: https://example.com)
 */
export function getBaseUrl(request: Request): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  const url = new URL(request.url);
  const fallback = `${url.protocol}//${url.host}`;
  // NEXTAUTH_URL não configurada — usando host do request como fallback.
  // Em produção isso gera links com o IP/porta interno (ex: 0.0.0.0:5000).
  // Defina NEXTAUTH_URL=https://seu-dominio.com.br nas variáveis de ambiente.
  console.warn(`[getBaseUrl] NEXTAUTH_URL não definida. Usando fallback: ${fallback}`);
  return fallback;
}
