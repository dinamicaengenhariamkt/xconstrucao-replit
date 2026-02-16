"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GlassNav } from "@/components/glass-nav";
import { SiteFooter } from "@/components/site-footer";
import { useToast } from "@shared/hooks/use-toast";

function ResetSenhaContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  const { toast } = useToast();

  useEffect(() => {
    // Se não houver token, redirecionar para recuperar senha
    if (!token) {
      router.push("/recuperar-senha");
    }
  }, [token, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter no mínimo 6 caracteres",
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

        // Redirecionar para login após 2 segundos
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
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <GlassNav />

      <main className="relative pt-32 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div
            className="bg-white dark:bg-slate-900/50 rounded-3xl p-10 border border-slate-100 dark:border-slate-800"
            style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
          >
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#333333]/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-[#333333] dark:text-white">
                  password
                </span>
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
                <label className="text-sm font-medium mb-2 block">Nova Senha</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Confirmar Senha</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Digite a senha novamente"
                    required
                    className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Redefinindo..." : "Redefinir Senha"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-8">
              Lembrou a senha?{" "}
              <Link
                href="/login"
                className="font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity"
              >
                Voltar ao login
              </Link>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function ResetSenhaPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetSenhaContent />
    </Suspense>
  );
}
