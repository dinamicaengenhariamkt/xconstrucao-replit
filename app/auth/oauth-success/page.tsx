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

      // Sucesso! Buscar o user para descobrir a role correta e redirecionar
      const meRes = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (meRes.ok) {
        const userData = await meRes.json();
        const role = userData?.role || userData?.user?.role;
        // J51 — primeiro acesso via Google também passa pelo wizard de onboarding
        // (exceto admin, que não se cadastra por aqui). Reusa o mesmo /me já lido.
        const onboardingConcluido =
          userData?.onboardingConcluido ?? userData?.user?.onboardingConcluido;
        const isAdmin = role === "admin" || role === "superadmin";
        const target =
          !isAdmin && onboardingConcluido === false
            ? "/onboarding"
            : role === "empreiteiro"
              ? "/empreiteiro/dashboard"
              : isAdmin
                ? "/admin/financeiro"
                : "/contratante/dashboard";
        router.replace(target);
      } else {
        router.replace("/contratante/dashboard");
      }
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
