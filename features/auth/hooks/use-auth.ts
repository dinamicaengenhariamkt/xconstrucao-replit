/**
 * Hook de autenticação - Wrapper do Zustand store
 * Mantém compatibilidade com código existente que usava Context API
 */

'use client';

import { useAuthStore } from '../store/auth-store';

// Re-exportar types para compatibilidade
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
  avatarUrl?: string | null;
}

export interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  phone?: string;
  acceptTerms: true;
}

export interface LogoutResult {
  persona: 'contratante' | 'empreiteiro' | 'administrador';
  redirect: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
    options?: { expectedRole?: string; antiBot?: { website: string; mountedAt: number } }
  ) => Promise<void>;
  register: (data: RegisterData & { antiBot?: { website: string; mountedAt: number } }) => Promise<void>;
  logout: () => Promise<LogoutResult>;
  refreshToken: (signal?: AbortSignal) => Promise<boolean>;
  checkAuth?: () => Promise<void>;
}

/**
 * Hook principal de autenticação
 * Agora usa Zustand ao invés de Context API
 */
export function useAuth(): AuthContextType {
  // Subscriptions seletivas para melhor performance
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const register = useAuthStore((state) => state.register);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const checkAuth = useAuthStore((state) => state.checkAuth);

  return {
    user,
    isLoading,
    login,
    logout,
    register,
    refreshToken,
    checkAuth,
  };
}

// Seletores específicos para componentes que só precisam de uma parte do estado
// Isso evita re-renders desnecessários
export const useUser = () => useAuthStore((state) => state.user);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useIsAuthenticated = () => {
  const user = useAuthStore((state) => state.user);
  return !!user;
};
