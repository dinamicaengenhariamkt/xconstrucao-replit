"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { useToast } from "@shared/hooks/use-toast";

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const email = searchParams.get("email");

  const getStatus = () => {
    if (success === "verified") return "verified";
    if (success === "already_verified") return "verified";
    if (error) return "error";
    return "pending";
  };

  const status = getStatus();

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: "Email reenviado!",
          description: "Verifique sua caixa de entrada e spam.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível reenviar o email. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao reenviar email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const errorMessages: Record<string, string> = {
    token_invalid: "Link de verificação inválido ou expirado.",
    token_missing: "Link de verificação incompleto.",
    user_not_found: "Usuário não encontrado.",
    server_error: "Erro no servidor. Tente novamente.",
  };

  return (
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <GlassNav />

      <main className="relative pt-32 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div
            className="bg-white dark:bg-slate-900/50 rounded-3xl p-10 border border-slate-100 dark:border-slate-800 text-center"
            style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
          >
            {status === "verified" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#22846D]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-[#22846D]">
                      check_circle
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold mb-2" data-testid="text-verified-title">
                  Email Verificado!
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                  Sua conta foi ativada com sucesso. Você já pode fazer login.
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all text-sm"
                  data-testid="button-go-login"
                >
                  Fazer Login
                </button>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-red-500">
                      error
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold mb-2" data-testid="text-error-title">
                  Erro na Verificação
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                  {error ? errorMessages[error] || "Ocorreu um erro inesperado." : "Ocorreu um erro inesperado."}
                </p>
                {email && (
                  <button
                    onClick={handleResendEmail}
                    disabled={isResending}
                    className="w-full bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all text-sm disabled:opacity-50 mb-4"
                    data-testid="button-resend-error"
                  >
                    {isResending ? "Reenviando..." : "Solicitar Novo Link"}
                  </button>
                )}
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity"
                  data-testid="link-back-login-error"
                >
                  Voltar ao login
                </button>
              </>
            )}

            {status === "pending" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#333333]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-[#333333] dark:text-white">
                      mark_email_unread
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold mb-2" data-testid="text-pending-title">
                  Verifique seu Email
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  Enviamos um email de confirmação para:
                </p>
                <p className="text-sm font-bold text-[#333333] dark:text-white mb-6" data-testid="text-email">
                  {email}
                </p>
                <p className="text-xs text-slate-400 mb-8">
                  Clique no link do email para ativar sua conta.
                  <br />
                  Verifique também sua caixa de spam.
                </p>

                <button
                  onClick={handleResendEmail}
                  disabled={isResending || !email}
                  className="w-full bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all text-sm disabled:opacity-50 mb-4"
                  data-testid="button-resend"
                >
                  {isResending ? "Reenviando..." : "Reenviar Email"}
                </button>

                <button
                  onClick={() => router.push("/login")}
                  className="text-sm font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity"
                  data-testid="link-back-login"
                >
                  Voltar ao login
                </button>
              </>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <VerificarEmailContent />
    </Suspense>
  );
}
