"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { SiteTemaRaiz } from "@features/landing/components/SiteTemaRaiz";
import { SiteHeroPagina } from "@features/landing/components/SiteHeroPagina";
import { Reveal } from "@features/landing/components/Reveal";
import { useToast } from "@shared/hooks/use-toast";
import { evaluatePasswordPolicy } from "@features/auth/schemas/password";
import { PasswordStrengthMeter } from "@features/auth/components/PasswordStrengthMeter";
import { PasswordInput } from "@features/auth/components/PasswordInput";
import { IconPassword } from '@shared/components/icons';

function ResetSenhaContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const { toast } = useToast();

  useEffect(() => {
    if (!token) {
      router.push("/recuperar-senha");
    }
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const policy = evaluatePasswordPolicy(newPassword);
    if (!policy.valid) {
      toast({
        title: "Senha inválida",
        description: policy.message ?? "Escolha uma senha mais forte.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Senha redefinida!",
          description: "Sua senha foi atualizada com sucesso.",
        });

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao redefinir senha",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao redefinir senha. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return null;
  }

  return (
    <SiteTemaRaiz>
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <GlassNav />
      <SiteHeroPagina compacto migalhas={[{ nome: 'Nova senha' }]} />

      <main className="relative z-10 -mt-2 flex flex-1 justify-center px-4 pb-16 sm:px-6 sm:pb-24">
        <div className="w-full max-w-md">
        <Reveal y={12}>
          <div
            className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)] sm:p-10 dark:border-white/10 dark:bg-[#22262A] dark:shadow-none"
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#333333]/10 dark:bg-white/10 flex items-center justify-center">
                <IconPassword className="text-3xl text-[#333333] dark:text-white" />
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-center mb-2">
              Redefinir Senha
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
              Digite sua nova senha
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block text-[#101819] dark:text-slate-300">Nova Senha</label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  autoComplete="new-password"
                  testId="input-new-password"
                />
                <PasswordStrengthMeter password={newPassword} />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-[#101819] dark:text-slate-300">Confirmar Senha</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                  autoComplete="new-password"
                  testId="input-confirm-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-12 bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all dark:bg-white dark:text-[#1C1F22] dark:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-reset-password"
              >
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
              Lembrou a senha?{" "}
              <Link
                href="/login"
                className="font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40"
              >
                Voltar ao login
              </Link>
            </p>
          </div>
        </Reveal>
        </div>
      </main>

      <SiteFooter />
    </div>
    </SiteTemaRaiz>
  );
}

export default function ResetSenhaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetSenhaContent />
    </Suspense>
  );
}
