/**
 * Componente de inicialização da autenticação
 * Substitui o useEffect do antigo AuthProvider
 * Executa checkAuth automaticamente APENAS em rotas autenticadas
 * (dashboard / admin / contratante / empreiteiro / xgestao), evitando disparar
 * POST /api/auth/refresh com 401 em páginas públicas como home,
 * cadastro, login, recuperar-senha, verificar-email, termos, etc.
 *
 * XG10 — além da checagem inicial, mantém a sessão viva enquanto a aba está
 * aberta. O access token dura 15 min (features/auth/api/auth-service.ts); sem
 * renovação periódica ele expirava no meio do uso e a primeira chamada seguinte
 * devolvia 401 — o relato de "expira depois de cinco minutos" na reunião de
 * 2026-09-12. Numa SPA não há navegação full-page para reidratar a sessão.
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
  '/anunciante',
  '/xgestao',
];

/**
 * Intervalo de renovação. Folga deliberada sobre os 15 min do access token:
 * cobre uma falha isolada (rede instável em obra) antes que o token expire.
 */
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

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

  // XG10 — mantém a sessão viva enquanto a aba está aberta em área autenticada.
  useEffect(() => {
    if (!isProtectedRoute(pathname)) return;

    // Só renova sessão que existe: sem usuário, o POST tomaria 401 em loop.
    // Lido fora do seletor para não reexecutar o efeito a cada troca de user.
    const temSessao = () => useAuthStore.getState().user !== null;
    const renovar = () => {
      if (temSessao()) void useAuthStore.getState().refreshToken();
    };

    const intervalId = setInterval(renovar, REFRESH_INTERVAL_MS);

    // Aba em segundo plano tem o timer represado pelo browser; ao voltar ao
    // foco o token pode já ter expirado. Renovar aqui evita que a primeira
    // ação do usuário ao retornar seja a que toma 401.
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') renovar();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname]);

  // Componente não renderiza nada
  return null;
}
