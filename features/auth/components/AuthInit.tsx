/**
 * Componente de inicialização da autenticação
 * Substitui o useEffect do antigo AuthProvider
 * Executa checkAuth automaticamente APENAS em rotas autenticadas
 * (dashboard / admin / contratante / empreiteiro), evitando disparar
 * POST /api/auth/refresh com 401 em páginas públicas como home,
 * cadastro, login, recuperar-senha, verificar-email, termos, etc.
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';

const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/admin',
  '/contratante',
  '/empreiteiro',
];

function isProtectedRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return PROTECTED_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function AuthInit() {
  const pathname = usePathname();
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const hasCheckedAuth = useAuthStore((state) => state._hasCheckedAuth);
  const skipInitialCheck = useAuthStore((state) => state._skipInitialCheck);

  useEffect(() => {
    // Não executa se já checou ou se deve pular
    if (hasCheckedAuth || skipInitialCheck) {
      return;
    }

    // Só dispara checkAuth em áreas autenticadas conhecidas.
    // Tudo o mais (home, landing, cadastro, login, FAQ pública, termos…) é
    // tratado como público e não precisa renovar sessão sem cookies.
    if (!isProtectedRoute(pathname)) {
      return;
    }

    checkAuth();
  }, [pathname, checkAuth, hasCheckedAuth, skipInitialCheck]);

  // Componente não renderiza nada
  return null;
}
