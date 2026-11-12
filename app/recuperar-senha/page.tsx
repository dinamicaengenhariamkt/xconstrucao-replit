"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { SiteTemaRaiz } from "@features/landing/components/SiteTemaRaiz";
import { SiteHeroPagina } from "@features/landing/components/SiteHeroPagina";
import { Reveal } from "@features/landing/components/Reveal";
import { useToast } from "@shared/hooks/use-toast";
import { useAntiBotPayload } from "@features/auth/hooks/use-anti-bot";
import { HoneypotField } from "@features/auth/components/HoneypotField";
import { IconMail, IconCheckCircle, IconLockReset } from '@shared/components/icons';

const RESEND_COOLDOWN = 60;

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();
  const antiBot = useAntiBotPayload();

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  async function postForgot(): Promise<boolean> {
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...antiBot.getPayload() }),
    });
    return response.ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const ok = await postForgot();
      if (ok) {
        setSent(true);
        setCooldown(RESEND_COOLDOWN);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível processar a solicitação. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch {
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
    if (cooldown > 0) return;
    try {
      const ok = await postForgot();
      if (ok) {
        toast({
          title: "Email reenviado!",
          description: "Verifique sua caixa de entrada.",
        });
        setCooldown(RESEND_COOLDOWN);
      } else {
        toast({
          title: "Erro",
          description: "Erro ao reenviar email",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Erro",
        description: "Erro ao reenviar email",
        variant: "destructive",
      });
    }
  }

  return (
    <SiteTemaRaiz>
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <GlassNav />
      <SiteHeroPagina compacto migalhas={[{ nome: 'Recuperar senha' }]} />

      <main className="relative z-10 -mt-2 flex flex-1 justify-center px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="w-full max-w-md">
        <Reveal y={12}>
          {!sent && (
            <div
              className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)] sm:p-10 dark:border-white/10 dark:bg-[#22262A] dark:shadow-none"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#333333]/10 dark:bg-white/10 flex items-center justify-center">
                  <IconLockReset className="text-3xl text-[#333333] dark:text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-center mb-2" data-testid="text-recover-title">
                Recuperar Senha
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
                Digite seu email para receber o link de recuperação
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <HoneypotField value={antiBot.website} onChange={antiBot.setWebsite} />
                <div>
                  <label className="text-sm font-medium mb-2 block text-[#101819] dark:text-slate-300">Email</label>
                  <div className="relative">
                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 min-h-12 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:border-[#333333]/40 focus:ring-2 focus:ring-[#333333]/20 dark:focus:border-white/30 dark:focus:ring-white/20"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-12 bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all dark:bg-white dark:text-[#1C1F22] dark:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="button-send-recovery"
                >
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </button>
              </form>

              <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
                Lembrou a senha?{" "}
                <Link
                  href="/acesso-plataforma"
                  className="font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40"
                  data-testid="link-back-login"
                >
                  Voltar ao login
                </Link>
              </p>
            </div>
          )}

          {sent && (
            <div
              className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)] sm:p-10 dark:border-white/10 dark:bg-[#22262A] dark:shadow-none text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#22846D]/10 flex items-center justify-center">
                  <IconCheckCircle className="text-3xl text-[#22846D]" />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold mb-2" data-testid="text-success-title">
                Link enviado com sucesso!
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                Enviamos um link de recuperação para:
              </p>
              <p className="text-sm font-bold text-[#333333] dark:text-white mb-8" data-testid="text-sent-email">
                {email}
              </p>
              <p className="text-xs text-slate-400 mb-6">
                Verifique sua caixa de entrada e a pasta de spam.
                <br />O link expira em 15 minutos.
              </p>

              <button
                onClick={handleResend}
                disabled={cooldown > 0}
                className="w-full min-h-12 bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all dark:bg-white dark:text-[#1C1F22] dark:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40 disabled:opacity-50 text-sm mb-4"
                data-testid="button-resend"
              >
                {cooldown > 0 ? `Reenviar em ${cooldown}s` : "Reenviar email"}
              </button>

              <Link
                href="/acesso-plataforma"
                className="text-sm font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40"
                data-testid="link-back-login-success"
              >
                Voltar ao login
              </Link>
            </div>
          )}
        </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
    </SiteTemaRaiz>
  );
}
