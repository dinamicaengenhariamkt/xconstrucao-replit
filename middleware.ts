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
export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const pathname = request.nextUrl.pathname;

  // Debug em desenvolvimento
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    console.log(`[Middleware] ${pathname} - access_token: ${accessToken ? '✅ presente' : '❌ ausente'}`);
  }

  // Proteção de rotas /dashboard
  if (pathname.startsWith("/dashboard")) {
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
    // Dashboard layout fará validação completa via useAuth
    if (isDev) {
      console.log(`[Middleware] Permitindo acesso ao dashboard`);
    }
    return NextResponse.next();
  }

  // Permitir acesso a outras rotas
  return NextResponse.next();
}

// Configurar rotas que devem passar pelo middleware
export const config = {
  matcher: ["/dashboard/:path*"],
};
