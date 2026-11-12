"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { SiteTemaRaiz } from "@features/landing/components/SiteTemaRaiz";
import { SiteHeroPagina } from "@features/landing/components/SiteHeroPagina";
import { Reveal } from "@features/landing/components/Reveal";
import { useToast } from "@shared/hooks/use-toast";
import { IconCheckCircle, IconError, IconMarkEmailUnread } from '@shared/components/icons';

const RESEND_COOLDOWN = 60;

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const email = searchParams.get("email");

  const getStatus = () => {
    if (success === "verified") return "verified";
    if (success === "already_verified") return "verified";
    if (success === "email_trocado") return "verified";
    if (error) return "error";
    return "pending";
  };

  const emailTrocado = success === "email_trocado";

  const status = getStatus();

  const handleResendEmail = async () => {
    if (!email || cooldown > 0) return;

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
        setCooldown(RESEND_COOLDOWN);
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
    email_em_uso: "Este email já está em uso por outra conta. A troca não foi concluída.",
  };

  return (
    <SiteTemaRaiz>
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <GlassNav />
      <SiteHeroPagina compacto migalhas={[{ nome: 'Verificar e-mail' }]} />

      <main className="relative z-10 -mt-2 flex flex-1 justify-center px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="w-full max-w-md">
        <Reveal y={12}>
          <div
            className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)] sm:p-10 dark:border-white/10 dark:bg-[#22262A] dark:shadow-none text-center"
          >
            {status === "verified" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#22846D]/10 flex items-center justify-center">
                    <IconCheckCircle className="text-3xl text-[#22846D]" />
                  </div>
                </div>
                <h2 className="text-2xl font-extrabold mb-2" data-testid="text-verified-title">
                  {emailTrocado ? "Email Atualizado!" : "Email Verificado!"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                  {emailTrocado
                    ? "Seu email de acesso foi alterado com sucesso. Use o novo email para entrar."
                    : "Sua conta foi ativada com sucesso. Você já pode fazer login."}
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="w-full min-h-12 bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all dark:bg-white dark:text-[#1C1F22] dark:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40 text-sm"
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
                    <IconError className="text-3xl text-red-500" />
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
                    disabled={isResending || cooldown > 0}
                    className="w-full min-h-12 bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all dark:bg-white dark:text-[#1C1F22] dark:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40 text-sm disabled:opacity-50 mb-4"
                    data-testid="button-resend-error"
                  >
                    {cooldown > 0
                      ? `Aguarde ${cooldown}s`
                      : isResending
                        ? "Reenviando..."
                        : "Solicitar Novo Link"}
                  </button>
                )}
                <button
                  onClick={() => router.push("/login")}
                  className="text-sm font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40"
                  data-testid="link-back-login-error"
                >
                  Voltar ao login
                </button>
              </>
            )}

            {status === "pending" && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#333333]/10 dark:bg-white/10 flex items-center justify-center">
                    <IconMarkEmailUnread className="text-3xl text-[#333333] dark:text-white" />
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
                  disabled={isResending || !email || cooldown > 0}
                  className="w-full min-h-12 bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all dark:bg-white dark:text-[#1C1F22] dark:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40 text-sm disabled:opacity-50 mb-4"
                  data-testid="button-resend"
                >
                  {cooldown > 0
                    ? `Aguarde ${cooldown}s para reenviar`
                    : isResending
                      ? "Reenviando..."
                      : "Reenviar Email"}
                </button>

                <button
                  onClick={() => router.push("/login")}
                  className="text-sm font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40"
                  data-testid="link-back-login"
                >
                  Voltar ao login
                </button>
              </>
            )}
          </div>
        </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
    </SiteTemaRaiz>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Carregando...</div>}>
      <VerificarEmailContent />
    </Suspense>
  );
}
