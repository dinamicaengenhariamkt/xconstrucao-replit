"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { queryClient } from "@shared/lib/queryClient";

// Tipos
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  image?: string | null;
  avatarUrl?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: (signal?: AbortSignal) => Promise<boolean>;
}

interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  phone?: string;
}

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const skipInitialCheckRef = useRef(false);
  const hasCheckedAuthRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Verificar se usuário está autenticado ao carregar
  useEffect(() => {
    // Cancelar requests pendentes quando pathname muda
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const isPublicAuthRoute =
      pathname === "/login" ||
      pathname === "/cadastro" ||
      pathname === "/recuperar-senha" ||
      pathname === "/reset-senha" ||
      pathname === "/verificar-email";

    // Early exit para rotas públicas
    if (isPublicAuthRoute) {
      setUser((currentUser) => {
        if (!currentUser) {
          setIsLoading(false);
        }
        return currentUser;
      });
      hasCheckedAuthRef.current = true;
      return;
    }

    // Skip se devemos pular verificação inicial (após login/oauth)
    if (skipInitialCheckRef.current) {
      skipInitialCheckRef.current = false;
      hasCheckedAuthRef.current = true;
      setIsLoading(false);
      return;
    }

    // Verificar auth apenas uma vez no mount ou ao navegar para rotas protegidas
    if (!hasCheckedAuthRef.current) {
      checkAuth();
      hasCheckedAuthRef.current = true;
    }

    // Cleanup: abortar requests pendentes no unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pathname]); // APENAS pathname como dependência

  const checkAuth = async () => {
    try {
      // Criar novo AbortController para este request
      const controller = new AbortController();
      abortControllerRef.current = controller;

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
      setIsLoading(false);
    }
  };

  const confirmSessionReady = async (): Promise<boolean> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (res.ok) return true;
      } catch {
        // Tenta novamente
      }

      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    return false;
  };

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Importante para cookies
        body: JSON.stringify({ email, password, rememberMe }),
      });

      if (!res.ok) {
        const error = await res.json();

        // Tratamento de erro específico para email não verificado
        if (error.error === "EMAIL_NOT_VERIFIED") {
          throw new Error("Por favor, verifique seu email antes de fazer login");
        }

        throw new Error(error.error || "Erro ao fazer login");
      }

      const data = await res.json();
      setUser(data.user);

      // Evita checkAuth() automático após login bem-sucedido
      skipInitialCheckRef.current = true;
      hasCheckedAuthRef.current = false; // Permitir que próximo effect defina loading state
      setIsLoading(false);

      // Confirmar sessão antes da navegação para reduzir race condition de cookies
      const sessionReady = await confirmSessionReady();

      if (!sessionReady) {
        setUser(null);
        throw new Error("Não foi possível confirmar a sessão. Tente novamente.");
      }

      // Redirecionar para dashboard
      router.replace("/dashboard");
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Erro ao criar conta");
      }

      // Redirecionar para página de verificação de email
      router.push(`/verificar-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Limpar cache do React Query
      queryClient.clear();

      // Chamar API de logout (limpa cookies)
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      // Mesmo com erro, limpar estado local
      setUser(null);
      router.push("/login");
    }
  };

  const refreshToken = async (signal?: AbortSignal): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        signal, // Passar AbortSignal para fetch
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
      console.error("Erro ao renovar token:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook para usar o contexto
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
}
