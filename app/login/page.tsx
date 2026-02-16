"use client";

// Prevent static generation for auth pages (use dynamic hooks)
export const dynamic = 'force-dynamic'

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { loginSchema } from "@features/auth/schemas";
import { useAuth } from "@features/auth/hooks/use-auth";
import { useToast } from "@shared/hooks/use-toast";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";

type LoginValues = z.infer<typeof loginSchema>;

const perfilConfig: Record<string, { icon: string; text: string }> = {
  contratante: { icon: "business", text: "Contratante" },
  empreiteiro: { icon: "construction", text: "Empreiteiro" },
  administrador: { icon: "admin_panel_settings", text: "Administrador" },
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const perfil = searchParams.get("perfil") || "contratante";
  const config = perfilConfig[perfil] || perfilConfig.contratante;
  const { login } = useAuth();
  const { toast } = useToast();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setIsLoading(true);
    try {
      await login(values.email, values.password, rememberMe);
    } catch (error: unknown) {
      // Tratar erro de email não verificado
      if (error instanceof Error && error.message.includes("EMAIL_NOT_VERIFIED")) {
        toast({
          title: "Email não verificado",
          description: "Por favor, verifique seu email antes de fazer login. Verifique sua caixa de entrada e spam.",
          variant: "destructive",
        });

        // Redirecionar para página de verificação
        setTimeout(() => {
          router.push(`/verificar-email?email=${encodeURIComponent(values.email)}`);
        }, 2000);

        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Erro ao fazer login. Tente novamente.";
      toast({
        title: "Erro no login",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <GlassNav />

      <main className="relative pt-32 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div
            className="bg-white dark:bg-slate-900/50 rounded-3xl p-10 border border-slate-100 dark:border-slate-800"
            style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
          >
            {/* Badge de Perfil */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#333333]/10 text-[#333333] dark:text-white text-sm font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">
                  {config.icon}
                </span>
                <span data-testid="text-perfil-badge">{config.text}</span>
              </div>
            </div>

            <h2
              className="text-2xl font-extrabold text-center mb-2"
              data-testid="text-login-title"
            >
              Bem-vindo de volta
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
              Acesse sua conta para continuar
            </p>

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => signIn("google", { callbackUrl: "/auth/oauth-success" })}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                data-testid="button-google-login"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continuar com Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium uppercase">
                ou
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Login Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                    data-testid="input-email"
                    {...form.register("email")}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Senha</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type="password"
                    placeholder="Sua senha"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                    data-testid="input-password"
                    {...form.register("password")}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-[#333333] focus:ring-[#333333]/20"
                    data-testid="checkbox-remember"
                  />
                  <span className="text-sm text-slate-500">Lembrar de mim</span>
                </label>
                <Link
                  href="/recuperar-senha"
                  className="text-sm font-medium text-[#333333] dark:text-white hover:opacity-70 transition-opacity"
                  data-testid="link-forgot-password"
                >
                  Esqueci minha senha
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all disabled:opacity-50 text-sm"
                data-testid="button-login"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>

            {/* Cadastro Link */}
            {perfil !== "administrador" && (
              <p
                className="text-center text-sm text-slate-500 mt-8"
                data-testid="cadastro-container"
              >
                Não tem conta?{" "}
                <Link
                  href={`/cadastro?perfil=${perfil}`}
                  className="font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity"
                  data-testid="link-register"
                >
                  Cadastre-se
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
