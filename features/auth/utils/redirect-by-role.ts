/**
 * Função para determinar a rota de redirecionamento baseada no role do usuário
 */

export type UserRole = 'superadmin' | 'admin' | 'contratante' | 'empreiteiro' | 'anunciante';

export function getRedirectPathByRole(role: string): string {
  switch (role) {
    case 'empreiteiro':
      return '/empreiteiro/dashboard';
    case 'contratante':
      return '/contratante/dashboard';
    case 'anunciante':
      return '/anunciante/dashboard';
    case 'superadmin':
    case 'admin':
      return '/admin/financeiro';
    default:
      return '/login';
  }
}

/**
 * Valida se o usuário tem permissão para acessar uma rota específica
 */
export function canAccessRoute(userRole: string, requiredRole: string): boolean {
  return userRole === requiredRole;
}

/**
 * Resolve o redirect pós-login com allowlist por role.
 * Se `nextParam` for um path interno (começa com `/`) cujo prefixo bate
 * com a role do usuário (ex.: contratante → `/contratante/...`), respeita.
 * Caso contrário, ignora silenciosamente e usa o dashboard padrão da role.
 *
 * Bloqueia: URLs absolutas (open redirect), protocol-relative (`//evil.com`),
 * paths de outra role (escalação cruzada), `/admin*` para não-admin.
 */
export function resolvePostLoginRedirect(role: string, nextParam: string | null): string {
  const fallback = getRedirectPathByRole(role);

  if (!nextParam) return fallback;
  // Bloqueia open redirect e URLs absolutas
  if (!nextParam.startsWith("/") || nextParam.startsWith("//")) return fallback;

  const allowedPrefixes: Record<string, string[]> = {
    // superadmin pode acessar qualquer área (modo "Ver como")
    superadmin: ["/admin", "/contratante", "/empreiteiro", "/anunciante"],
    admin: ["/admin"],
    contratante: ["/contratante"],
    empreiteiro: ["/empreiteiro"],
    anunciante: ["/anunciante"],
  };

  const prefixes = allowedPrefixes[role] ?? [];
  const isAllowed = prefixes.some(
    (p) => nextParam === p || nextParam.startsWith(`${p}/`)
  );

  return isAllowed ? nextParam : fallback;
}

/**
 * Verifica se uma rota é pública (não precisa de autenticação)
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/login',
    '/cadastro',
    '/recuperar-senha',
    '/reset-senha',
    '/verificar-email',
    '/termos',
    '/politica-privacidade',
    '/',
  ];

  return publicRoutes.includes(pathname) || pathname.startsWith('/_next');
}
