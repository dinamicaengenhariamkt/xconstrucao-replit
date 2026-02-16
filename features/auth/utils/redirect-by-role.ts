/**
 * Função para determinar a rota de redirecionamento baseada no role do usuário
 */

export type UserRole = 'admin' | 'contratante' | 'empreiteiro';

export function getRedirectPathByRole(role: string): string {
  switch (role) {
    case 'empreiteiro':
      return '/empreiteiro/dashboard';
    case 'contratante':
      return '/contratante/dashboard';
    case 'admin':
      return '/administrador/financeiro';
    default:
      // Fallback para dashboard genérico
      return '/dashboard';
  }
}

/**
 * Valida se o usuário tem permissão para acessar uma rota específica
 */
export function canAccessRoute(userRole: string, requiredRole: string): boolean {
  return userRole === requiredRole;
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
