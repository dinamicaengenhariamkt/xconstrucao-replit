import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware para proteção de rotas
 *
 * Nota: Este middleware roda no Edge Runtime, que não suporta módulos Node.js
 * como 'crypto'. Por isso, apenas verificamos a PRESENÇA do cookie access_token.
 *
 * A validação COMPLETA do JWT acontece em:
 * 1. Dashboard Layout - useAuth() hook valida token e redireciona se inválido
 * 2. API Routes - Validam tokens server-side (Node.js runtime) antes de retornar dados
 *
 * Esta abordagem mantém 3 camadas de segurança (defense in depth):
 * - Middleware: barreira inicial (verifica presença do cookie)
 * - Frontend: validação + UX (useAuth redireciona usuários não autenticados)
 * - Backend: validação final (APIs rejeitam requests com tokens inválidos)
 */
const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const PASSWORD_CHANGE_API_ALLOWLIST = new Set<string>([
  "/api/auth/change-password-forced",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/refresh",
  "/api/auth/definir-senha-inicial",
]);

/**
 * Lê o claim `mustChangePassword` do access token sem validar assinatura
 * (Edge Runtime não tem `crypto.createHmac`). A validação completa acontece
 * no `requireVerifiedUser`. Aqui só precisamos do hint para bloquear
 * todas as rotas /api/* enquanto a senha não foi trocada.
 */
function decodeMustChangePassword(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length < 2) return false;
  try {
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const json = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
    const claims = JSON.parse(json) as { mustChangePassword?: boolean };
    return claims.mustChangePassword === true;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const pathname = request.nextUrl.pathname;

  // Bloqueio GLOBAL: enquanto must_change_password=true, todas as rotas
  // /api/* são bloqueadas (com allowlist mínima). Cobre rotas legadas que
  // não usam `requireVerifiedUser` (ex.: GET /api/clientes).
  if (
    pathname.startsWith("/api/") &&
    !PASSWORD_CHANGE_API_ALLOWLIST.has(pathname) &&
    decodeMustChangePassword(accessToken)
  ) {
    return NextResponse.json(
      {
        error: "PASSWORD_CHANGE_REQUIRED",
        message: "Troca de senha obrigatória. Acesse /trocar-senha-obrigatoria para continuar.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  // Modo "Ver como" (impersonation) — bloqueio GLOBAL de mutações em /api/*
  // Independe do `requireVerifiedUser` interno; cobre rotas legadas também.
  if (
    pathname.startsWith("/api/") &&
    pathname !== "/api/admin/impersonate/exit" &&
    !READ_ONLY_METHODS.has(request.method) &&
    !!request.cookies.get("impersonation_token")?.value
  ) {
    return NextResponse.json(
      {
        error: "IMPERSONATION_READ_ONLY",
        message: "Modo somente leitura ativo. Saia do modo visualização para fazer alterações.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  // Debug em desenvolvimento
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log(`[Middleware] ${pathname} - access_token: ${accessToken ? '✅ presente' : '❌ ausente'}`);
  }

  // Rotas protegidas que requerem autenticação
  const protectedRoutes = [
    "/dashboard",
    "/empreiteiro",
    "/contratante",
    "/administrador",
  ];

  // Verifica se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Se não tem access token, redirecionar para login
    // Nota: Não validamos JWT aqui (Edge Runtime não suporta crypto)
    // Validação completa acontece no useAuth() hook e API routes
    if (!accessToken) {
      if (isDev) {
        console.log(`[Middleware] Redirecionando para /login - sem access_token`);
      }
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    // Cookie existe - permitir acesso
    // Layout específico de cada área fará validação completa via useAuth
    if (isDev) {
      console.log(`[Middleware] Permitindo acesso a rota protegida: ${pathname}`);
    }
    return NextResponse.next();
  }

  // Permitir acesso a outras rotas
  return NextResponse.next();
}

// Configurar rotas que devem passar pelo middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/empreiteiro/:path*",
    "/contratante/:path*",
    "/administrador/:path*",
    "/api/:path*",
  ],
};
