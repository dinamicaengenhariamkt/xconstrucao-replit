"use client";

import { SessionProvider, useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { queryClient } from "./queryClient";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (email: string, password: string, rememberMe?: boolean) => {
    const result = await signIn("credentials", {
      email,
      password,
      rememberMe, // Será usado no callback jwt
      redirect: false,
    });

    if (result?.error) {
      throw new Error(result.error);
    }

    // Redirecionar para dashboard após login
    router.push("/dashboard");
  };

  const register = async (data: {
    name: string;
    email: string;
    username: string;
    password: string;
    role: string;
    phone?: string;
  }) => {
    // Criar usuário via API
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Erro ao criar conta");
    }

    const result = await res.json();

    // Redirecionar para página de verificação de email
    router.push(`/verificar-email?email=${encodeURIComponent(data.email)}`);
  };

  const logout = async () => {
    queryClient.clear();
    await signOut({ redirect: false });
    router.push("/login");
  };

  return {
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email!,
          name: session.user.name!,
          role: session.user.role,
          image: session.user.image,
          // Campos extras para compatibilidade (se necessário)
          username: null,
          password: null,
          emailVerified: null,
          phone: null,
          avatarUrl: session.user.image,
        }
      : null,
    isLoading: status === "loading",
    login,
    register,
    logout,
  };
}
