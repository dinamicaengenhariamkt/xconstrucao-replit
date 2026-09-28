"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resolvePostLoginRedirect } from "@features/auth/utils/redirect-by-role";
import { useAuthStore } from "@features/auth/store/auth-store";

function OAuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void convertOAuthToJWT();
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

      let meRes: Response | undefined;
      for (let attempt = 0; attempt < 3; attempt++) {
        meRes = await fetch("/api/auth/me", {
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

      if (!meRes?.ok) throw new Error("Sessão OAuth não confirmada");
      const userData = await meRes.json();
      const user = userData?.user ?? userData;
      if (!user || typeof user.id !== "string" || typeof user.role !== "string") {
        throw new Error("Dados da sessão OAuth inválidos");
      }

      // /me confirmou a sessão: hidratar o mesmo store que /onboarding consome
      // antes de navegar. Evita um refresh desnecessário logo após a conversão.
      const auth = useAuthStore.getState();
      auth.setUser(user);
      auth.setSkipInitialCheck(true);
      auth.setHasCheckedAuth(false);
      auth.setLoading(false);

      const role = user.role;
      const roles = user.roles || [];
      const isAdmin = role === "admin" || role === "superadmin";
      const loginContext =
        searchParams.get("context") === "xgestao" ? "xgestao" : undefined;
      const target =
        !isAdmin && user.onboardingConcluido === false
          ? "/onboarding"
          : resolvePostLoginRedirect(
              role,
              searchParams.get("next"),
              roles,
              user.adminEscopo,
              loginContext,
            );
      router.replace(target);
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

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Finalizando login...</div>}>
      <OAuthSuccessContent />
    </Suspense>
  );
}
