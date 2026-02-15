"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OAuthSuccessPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    convertOAuthToJWT();
  }, []);

  const convertOAuthToJWT = async () => {
    try {
      // Converter sessão NextAuth OAuth em tokens JWT custom
      const res = await fetch("/api/auth/oauth-convert", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Erro ao converter sessão OAuth");
      }

      for (let attempt = 0; attempt < 3; attempt++) {
        const meRes = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (meRes.ok) break;

        if (attempt === 2) {
          throw new Error("Sessão OAuth não confirmada");
        }

        await new Promise((resolve) => setTimeout(resolve, 150));
      }

      // Sucesso! Redirecionar para dashboard
      router.replace("/dashboard");
    } catch (error) {
      console.error("Erro no callback OAuth:", error);
      setError("Erro ao processar login. Tente novamente.");

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Finalizando login...</p>
      </div>
    </div>
  );
}
