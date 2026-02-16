/**
 * Componente de inicialização da autenticação
 * Substitui o useEffect do antigo AuthProvider
 * Executa checkAuth automaticamente em rotas protegidas
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password'];

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

    // Não executa em rotas públicas
    const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname?.startsWith(route));
    if (isPublicRoute) {
      return;
    }

    // Executa checkAuth em rotas protegidas
    checkAuth();
  }, [pathname, checkAuth, hasCheckedAuth, skipInitialCheck]);

  // Componente não renderiza nada
  return null;
}
