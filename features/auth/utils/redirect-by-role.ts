/**
 * Função para determinar a rota de redirecionamento baseada no role do usuário
 */

export type UserRole = 'superadmin' | 'admin' | 'contratante' | 'empreiteiro' | 'anunciante' | 'xgestao';
export type LoginContext = 'xgestao';

export function getRedirectPathByRole(
  role: string,
  roles: string[] = [],
  adminEscopo?: string,
): string {
  if (role === 'empreiteiro' && roles.includes('xgestao')) {
    return '/xgestao/obras';
  }

  switch (role) {
    case 'empreiteiro':
      return '/empreiteiro/dashboard';
    case 'contratante':
      return '/contratante/dashboard';
    case 'anunciante':
      return '/anunciante/dashboard';
    case 'superadmin':
      return '/admin/financeiro';
    case 'admin':
      return adminEscopo === 'xgestao' ? '/admin/xgestao' : '/admin/financeiro';
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
export function resolvePostLoginRedirect(
  role: string,
  nextParam: string | null,
  roles: string[] = [],
  adminEscopo?: string,
  loginContext?: LoginContext,
): string {
  const isAdmin = role === 'admin' || role === 'superadmin';
  const fallback =
    loginContext === 'xgestao' && isAdmin
      ? '/admin/xgestao'
      : getRedirectPathByRole(role, roles, adminEscopo);

  if (!nextParam) return fallback;
  // Bloqueia open redirect e URLs absolutas
  if (!nextParam.startsWith("/") || nextParam.startsWith("//")) return fallback;

  const allowedPrefixes: Record<string, string[]> = {
    // O xgestão exige um empreiteiro autorizado como sujeito operacional e só
    // é aberto a superadmin com o cookie assinado de "Ver como".
    superadmin: loginContext === 'xgestao'
      ? ["/admin/xgestao"]
      : ["/admin", "/contratante", "/empreiteiro", "/anunciante"],
    admin: loginContext === 'xgestao' || adminEscopo === 'xgestao'
      ? ["/admin/xgestao"]
      : ["/admin"],
    contratante: ["/contratante"],
    empreiteiro: roles.includes('xgestao') ? ["/empreiteiro", "/xgestao"] : ["/empreiteiro"],
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
