import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "./auth-service";
import { getUser } from "./auth-storage";
import { readImpersonationFromRequest, isReadOnlyMethod, type ImpersonationPayload } from "./impersonation";
import { recordAudit } from "./audit";
import type { User } from "@shared/db/schema";

/**
 * Resultado padronizado para guards de autenticação em rotas API.
 * - `error: NextResponse` quando o usuário não pode prosseguir (401/403)
 * - `user: User`           quando está autenticado e com email verificado
 *                          (durante impersonation read-only este será o
 *                           target — use `impersonation` para identificar)
 */
export type AuthGuardResult =
  | { user: User; error: null; impersonation: ImpersonationContext | null; actor: User | null }
  | { user: null; error: NextResponse; impersonation: null; actor: null };

export interface ImpersonationContext {
  actorId: string;
  targetId: string;
}

/**
 * Garante que a request veio de um usuário autenticado COM email verificado.
 * Suporta o modo "Ver como" (impersonation) — apenas super admin pode ativar
 * e somente verbos de leitura passam (mutações retornam 403 padronizado).
 */
export async function requireVerifiedUser(request: NextRequest): Promise<AuthGuardResult> {
  const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
  const payload = token ? verifyAccessToken(token) : null;

  if (!payload?.sub) {
    const response = NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    setNoCacheHeaders(response);
    return { user: null, error: response, impersonation: null, actor: null };
  }

  const actorUser = await getUser(payload.sub);
  if (!actorUser) {
    const response = NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    setNoCacheHeaders(response);
    return { user: null, error: response, impersonation: null, actor: null };
  }

  if (!actorUser.emailVerified) {
    const response = NextResponse.json(
      { error: "EMAIL_NOT_VERIFIED", message: "Verifique seu email para liberar esta ação." },
      { status: 403 },
    );
    setNoCacheHeaders(response);
    return { user: null, error: response, impersonation: null, actor: null };
  }

  if (!actorUser.ativo) {
    const response = NextResponse.json(
      { error: "ACCOUNT_DISABLED", message: "Sua conta está desativada. Contate o administrador." },
      { status: 403 },
    );
    setNoCacheHeaders(response);
    return { user: null, error: response, impersonation: null, actor: null };
  }

  // ----- Forced password change gate -----
  // Quando must_change_password=true, bloqueia toda navegação autenticada
  // até a troca, exceto para um conjunto pequeno de endpoints essenciais
  // (troca de senha, logout, /me, refresh).
  if (actorUser.mustChangePassword) {
    const pathname = new URL(request.url).pathname;
    if (!isPasswordChangeAllowedPath(pathname)) {
      const response = NextResponse.json(
        {
          error: "PASSWORD_CHANGE_REQUIRED",
          message: "Troca de senha obrigatória. Acesse /trocar-senha-obrigatoria para continuar.",
        },
        { status: 403 },
      );
      setNoCacheHeaders(response);
      return { user: null, error: response, impersonation: null, actor: null };
    }
  }

  // ----- Impersonation -----
  const imp = readImpersonationFromRequest(request);
  if (imp && imp.actorId === actorUser.id && actorUser.role === "superadmin") {
    const target = await getUser(imp.targetId);
    if (target && target.ativo) {
      if (!isReadOnlyMethod(request.method)) {
        const response = NextResponse.json(
          {
            error: "IMPERSONATION_READ_ONLY",
            message: "Modo somente leitura ativo. Saia do modo visualização para fazer alterações.",
          },
          { status: 403 },
        );
        setNoCacheHeaders(response);
        return { user: null, error: response, impersonation: null, actor: null };
      }
      // Auditar GET tocada em modo impersonation (best-effort, não bloqueia)
      void recordAudit({
        actorId: actorUser.id,
        targetUserId: target.id,
        action: `impersonate:${new URL(request.url).pathname}`,
        request,
      });
      return {
        user: target,
        error: null,
        impersonation: { actorId: actorUser.id, targetId: target.id },
        actor: actorUser,
      };
    }
  }

  return { user: actorUser, error: null, impersonation: null, actor: actorUser };
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
  response.cookies.set("access_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  response.cookies.set("refresh_token", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
}

/**
 * Configura headers de no-cache para respostas de autenticação
 */
export function setNoCacheHeaders(response: NextResponse): void {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
}

/**
 * Endpoints que continuam acessíveis enquanto a conta tem must_change_password=true.
 * Inclui: a própria troca, logout, /me (para o front detectar a flag), refresh
 * (para manter o cookie vivo) e o setup inicial via link.
 */
const PASSWORD_CHANGE_ALLOWLIST = new Set<string>([
  "/api/auth/change-password-forced",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/refresh",
  "/api/auth/definir-senha-inicial",
]);
function isPasswordChangeAllowedPath(pathname: string): boolean {
  return PASSWORD_CHANGE_ALLOWLIST.has(pathname);
}

export function getBaseUrl(request: Request): string {
  const url = new URL(request.url);
  return process.env.NEXTAUTH_URL || `${url.protocol}//${url.host}`;
}

/**
 * Helper de role: "admin OU superadmin".
 * Use em endpoints administrativos que precisam liberar o superadmin
 * pelo mesmo gate que o admin (perfil/admin, /admin/configuracoes,
 * moderação de cadastro etc.). Não inclui contratante/empreiteiro.
 */
export function isAdminLike(role: string | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}
