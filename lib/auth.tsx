"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { queryClient } from "./queryClient";

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
  refreshToken: () => Promise<boolean>;
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
  const [skipInitialCheck, setSkipInitialCheck] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Verificar se usuário está autenticado ao carregar
  useEffect(() => {
    const isPublicAuthRoute =
      pathname === "/login" ||
      pathname === "/cadastro" ||
      pathname === "/recuperar-senha" ||
      pathname === "/reset-senha" ||
      pathname === "/verificar-email";

    if (isPublicAuthRoute && !user) {
      setIsLoading(false);
      return;
    }

    // Evita race condition após login bem-sucedido
    if (!skipInitialCheck) {
      checkAuth();
    } else {
      setIsLoading(false);
      setSkipInitialCheck(false);
    }
  }, [skipInitialCheck, pathname, user]);

  const checkAuth = async () => {
    try {
      // Tentar renovar token (se existir refresh token)
      const success = await refreshToken();

      if (!success) {
        setUser(null);
      }
    } catch (error) {
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
      setSkipInitialCheck(true);
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

  const refreshToken = async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      setUser(data.user);
      return true;
    } catch (error) {
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
