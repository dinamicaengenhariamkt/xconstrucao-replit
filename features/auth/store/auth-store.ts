/**
 * Zustand Store para Autenticação
 * Substitui o Context API com melhor performance e DX
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { queryClient } from '@shared/lib/queryClient';
import { getRedirectPathByRole } from '../utils/redirect-by-role';

// Tipos
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
  avatarUrl?: string | null;
}

interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  phone?: string;
}

interface AuthState {
  // Estado
  user: User | null;
  isLoading: boolean;

  // Refs internos (não expostos)
  _abortController: AbortController | null;
  _hasCheckedAuth: boolean;
  _skipInitialCheck: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setHasCheckedAuth: (checked: boolean) => void;
  setSkipInitialCheck: (skip: boolean) => void;

  login: (email: string, password: string, rememberMe?: boolean, router?: any) => Promise<void>;
  register: (data: RegisterData, router?: any) => Promise<void>;
  logout: (router?: any) => Promise<void>;
  refreshToken: (signal?: AbortSignal) => Promise<boolean>;
  checkAuth: () => Promise<void>;
  confirmSessionReady: () => Promise<boolean>;
  createAbortController: () => AbortController;
  abortPendingRequests: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Estado inicial
        user: null,
        isLoading: true,
        _abortController: null,
        _hasCheckedAuth: false,
        _skipInitialCheck: false,

        // Setters simples
        setUser: (user) => set({ user }),
        setLoading: (isLoading) => set({ isLoading }),
        setHasCheckedAuth: (checked) => set({ _hasCheckedAuth: checked }),
        setSkipInitialCheck: (skip) => set({ _skipInitialCheck: skip }),

        // Criar novo AbortController
        createAbortController: () => {
          const controller = new AbortController();
          set({ _abortController: controller });
          return controller;
        },

        // Abortar requests pendentes
        abortPendingRequests: () => {
          const { _abortController } = get();
          if (_abortController) {
            _abortController.abort();
            set({ _abortController: null });
          }
        },

        // Confirmar que sessão está pronta (tenta 3 vezes)
        confirmSessionReady: async (): Promise<boolean> => {
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const res = await fetch('/api/auth/me', {
                method: 'GET',
                credentials: 'include',
                cache: 'no-store',
              });

              if (res.ok) return true;
            } catch {
              // Tenta novamente
            }

            await new Promise((resolve) => setTimeout(resolve, 150));
          }

          return false;
        },

        // Verificar autenticação
        checkAuth: async () => {
          const { createAbortController, refreshToken, setUser, setLoading } = get();

          try {
            const controller = createAbortController();
            const success = await refreshToken(controller.signal);

            // Verificar se request foi abortado
            if (controller.signal.aborted) {
              return;
            }

            if (!success) {
              setUser(null);
            }
          } catch (error) {
            // Ignorar erros de abort (são intencionais)
            if (error instanceof Error && error.name === 'AbortError') {
              return;
            }
            setUser(null);
          } finally {
            setLoading(false);
          }
        },

        // Renovar token
        refreshToken: async (signal?: AbortSignal): Promise<boolean> => {
          const { setUser } = get();

          try {
            const res = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
              cache: 'no-store',
              signal,
            });

            if (!res.ok) {
              return false;
            }

            const data = await res.json();
            setUser(data.user);
            return true;
          } catch (error) {
            // Não logar erros de abort (são intencionais)
            if (error instanceof Error && error.name === 'AbortError') {
              return false;
            }
            console.error('Erro ao renovar token:', error);
            return false;
          }
        },

        // Login
        login: async (email: string, password: string, rememberMe: boolean = false, router?: any) => {
          const { setUser, setSkipInitialCheck, setHasCheckedAuth, setLoading, confirmSessionReady } =
            get();

          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ email, password, rememberMe }),
            });

            if (!res.ok) {
              const error = await res.json();

              // Tratamento de erro específico para email não verificado
              if (error.error === 'EMAIL_NOT_VERIFIED') {
                throw new Error('Por favor, verifique seu email antes de fazer login');
              }

              throw new Error(error.error || 'Erro ao fazer login');
            }

            const data = await res.json();
            setUser(data.user);

            // Evita checkAuth() automático após login bem-sucedido
            setSkipInitialCheck(true);
            setHasCheckedAuth(false);
            setLoading(false);

            // Confirmar sessão antes da navegação para reduzir race condition de cookies
            const sessionReady = await confirmSessionReady();

            if (!sessionReady) {
              setUser(null);
              throw new Error('Não foi possível confirmar a sessão. Tente novamente.');
            }

            // ✅ NOVO: Redirecionar baseado em role
            if (router && data.user.role) {
              const redirectPath = getRedirectPathByRole(data.user.role);
              router.replace(redirectPath);
            } else if (router) {
              // Fallback para dashboard genérico
              router.replace('/dashboard');
            }
          } catch (error) {
            throw error;
          }
        },

        // Registro
        register: async (data: RegisterData, router?: any) => {
          try {
            const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            });

            if (!res.ok) {
              const error = await res.json();
              throw new Error(error.message || 'Erro ao criar conta');
            }

            // Redirecionar para página de verificação de email
            if (router) {
              router.push(`/verificar-email?email=${encodeURIComponent(data.email)}`);
            }
          } catch (error) {
            throw error;
          }
        },

        // Logout
        logout: async (router?: any) => {
          const { setUser } = get();

          try {
            // Limpar cache do React Query
            queryClient.clear();

            // Chamar API de logout (limpa cookies)
            await fetch('/api/auth/logout', {
              method: 'POST',
              credentials: 'include',
            });

            setUser(null);

            if (router) {
              router.push('/login');
            }
          } catch (error) {
            console.error('Erro ao fazer logout:', error);
            // Mesmo com erro, limpar estado local
            setUser(null);

            if (router) {
              router.push('/login');
            }
          }
        },
      }),
      {
        name: 'auth-storage',
        // Apenas persiste o user (não persist isLoading, controllers, etc)
        partialize: (state) => ({
          user: state.user,
        }),
      }
    ),
    {
      name: 'AuthStore',
    }
  )
);

// Hook de conveniência (mantém interface compatível com Context API)
export const useAuth = () => {
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
};

// Seletores específicos para performance
export const useUser = () => useAuthStore((state) => state.user);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
