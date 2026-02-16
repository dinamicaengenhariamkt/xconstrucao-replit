"use client";

import { useState } from "react";
import Link from "next/link";
import { GlassNav } from "@/components/glass-nav";
import { SiteFooter } from "@/components/site-footer";
import { useToast } from "@shared/hooks/use-toast";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSent(true);
      } else {
        const data = await response.json();
        toast({
          title: "Erro",
          description: data.message || "Erro ao enviar email de recuperação",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar email. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: "Email reenviado!",
          description: "Verifique sua caixa de entrada.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Erro ao reenviar email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reenviar email",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => setResending(false), 2000);
    }
  }

  return (
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <GlassNav />

      <main className="relative pt-32 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          {/* Form State */}
          {!sent && (
            <div
              className="bg-white dark:bg-slate-900/50 rounded-3xl p-10 border border-slate-100 dark:border-slate-800"
              style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#333333]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-[#333333] dark:text-white">
                    lock_reset
                  </span>
                </div>
              </div>

              <h2
                className="text-2xl font-extrabold text-center mb-2"
                data-testid="text-recover-title"
              >
                Recuperar Senha
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
                Digite seu email para receber o link de recuperação
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                      mail
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-send-recovery"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 mt-8">
                Lembrou a senha?{" "}
                <Link
                  href="/acesso-plataforma"
                  className="font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity"
                  data-testid="link-back-login"
                >
                  Voltar ao login
                </Link>
              </p>
            </div>
          )}

          {/* Success State */}
          {sent && (
            <div
              className="bg-white dark:bg-slate-900/50 rounded-3xl p-10 border border-slate-100 dark:border-slate-800 text-center"
              style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#22846D]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-[#22846D]">
                    check_circle
                  </span>
                </div>
              </div>

              <h2
                className="text-2xl font-extrabold mb-2"
                data-testid="text-success-title"
              >
                Link enviado com sucesso!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                Enviamos um link de recuperação para:
              </p>
              <p
                className="text-sm font-bold text-[#333333] dark:text-white mb-8"
                data-testid="text-sent-email"
              >
                {email}
              </p>
              <p className="text-xs text-slate-400 mb-6">
                Verifique sua caixa de entrada e a pasta de spam.
                <br />O link expira em 15 minutos.
              </p>

              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all disabled:opacity-50 text-sm mb-4"
                data-testid="button-resend"
              >
                {resending ? "Email reenviado!" : "Reenviar email"}
              </button>

              <Link
                href="/acesso-plataforma"
                className="text-sm font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity"
                data-testid="link-back-login-success"
              >
                Voltar ao login
              </Link>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
