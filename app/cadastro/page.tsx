"use client";

// Prevent static generation for auth pages (use dynamic hooks)
export const dynamic = 'force-dynamic'

import React from 'react';
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { registerSchema } from "@features/auth/schemas";
import { useAuth } from "@features/auth/hooks/use-auth";
import { useToast } from "@shared/hooks/use-toast";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { useAntiBotPayload } from "@features/auth/hooks/use-anti-bot";
import { HoneypotField } from "@features/auth/components/HoneypotField";
import { PasswordStrengthMeter } from "@features/auth/components/PasswordStrengthMeter";
import { PasswordInput } from "@features/auth/components/PasswordInput";
import {
  IconPerson,
  IconMail,
  IconAlternateEmail,
  IconPhone,
  IconBusiness,
  IconConstruction,
} from '@shared/components/icons';
import { formatCpfCnpj } from "@shared/lib/masks";

type RegisterValues = z.infer<typeof registerSchema>;
// Tipo de input do formulário: o checkbox precisa começar como `false`,
// mas o schema exige `literal(true)` no parse. Separar input vs. output evita
// cast unsafe e mantém a validação do zodResolver intacta.
type RegisterFormInput = Omit<RegisterValues, "acceptTerms"> & { acceptTerms: boolean };

const perfilConfig: Record<string, { Icon: React.ComponentType<{ className?: string }>; text: string }> = {
  contratante: { Icon: IconBusiness, text: "Contratante" },
  empreiteiro: { Icon: IconConstruction, text: "Empreiteiro" },
  // J23 — cadastro de anunciante (outsider que entra direto pela vitrine de anúncios).
  anunciante: { Icon: IconBusiness, text: "Anunciante" },
};

const ROLES_CADASTRO = ["contratante", "empreiteiro", "anunciante"] as const;
function perfilParaRole(perfil: string): "contratante" | "empreiteiro" | "anunciante" {
  return (ROLES_CADASTRO as readonly string[]).includes(perfil)
    ? (perfil as "contratante" | "empreiteiro" | "anunciante")
    : "contratante";
}

export default function CadastroPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const perfil = searchParams.get("perfil") || "contratante";
  const config = perfilConfig[perfil] || perfilConfig.contratante;
  const { register: registerUser } = useAuth();
  const { toast } = useToast();
  const antiBot = useAntiBotPayload();

  useEffect(() => {
    if (perfil === "administrador") {
      router.push("/login?perfil=administrador");
    }
  }, [perfil, router]);

  const form = useForm<RegisterFormInput>({
    resolver: zodResolver(registerSchema) as never,
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      role: perfilParaRole(perfil),
      phone: "",
      cpfCnpj: "",
      acceptTerms: false,
    },
  });

  // CPF/CNPJ só é exigido/coletado para contratante e empreiteiro — pré-requisito
  // do gateway de pagamento (ASAAS) para assinar planos. Anunciante fica isento.
  const roleAtual = perfilParaRole(perfil);
  const exigeCpfCnpj = roleAtual === "contratante" || roleAtual === "empreiteiro";
  // Empreiteiro se cadastra como pessoa jurídica — só CNPJ. Contratante aceita
  // os dois (pessoa reformando a própria casa ou empresa contratando).
  const somenteCnpj = roleAtual === "empreiteiro";

  const passwordValue = form.watch("password");
  const cpfCnpjValue = form.watch("cpfCnpj");
  const nameValue = form.watch("name");
  const emailValue = form.watch("email");
  const usernameValue = form.watch("username");

  const onSubmit = form.handleSubmit(
    async (values) => {
      setIsLoading(true);
      try {
        await registerUser({
          ...values,
          role: perfilParaRole(perfil),
          acceptTerms: true,
          antiBot: antiBot.getPayload(),
        });
        toast({
          title: "Conta criada com sucesso!",
          description: "Enviamos um email de confirmação. Verifique sua caixa de entrada.",
        });
        router.push(`/verificar-email?email=${encodeURIComponent(values.email)}`);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao criar conta. Tente novamente.";
        toast({ title: "Erro no cadastro", description: message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    (errors) => {
      const order = ["name", "email", "username", "phone", "cpfCnpj", "password", "acceptTerms"] as const;
      const firstField = order.find((f) => errors[f]?.message);
      const firstMsg = firstField
        ? (errors[firstField]?.message as string)
        : "Verifique os campos destacados.";
      toast({
        title: "Não foi possível criar a conta",
        description: firstMsg,
        variant: "destructive",
      });
    },
  );

  if (perfil === "administrador") return null;

  const errs = form.formState.errors;
  const passwordError = errs.password?.message;
  const nameError = errs.name?.message;
  const emailError = errs.email?.message;
  const usernameError = errs.username?.message;
  const phoneError = errs.phone?.message;
  const cpfCnpjError = errs.cpfCnpj?.message;
  const termsError = errs.acceptTerms?.message;

  return (
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <GlassNav showAccessButton={false} />

      <main className="relative pt-32 flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div
            className="bg-white dark:bg-slate-900/50 rounded-3xl p-10 border border-slate-100 dark:border-slate-800"
            style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
          >
            {/* Badge de Perfil */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#333333]/10 text-[#333333] dark:text-white text-sm font-bold uppercase tracking-wider">
                <config.Icon className="text-lg" />
                <span data-testid="text-perfil-badge">{config.text}</span>
              </div>
            </div>

            <h2
              className="text-2xl font-extrabold text-center mb-2"
              data-testid="text-register-title"
            >
              Criar conta
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
              Preencha seus dados para começar
            </p>

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  const persona = perfil === "empreiteiro" ? "empreiteiro" : "contratante";
                  document.cookie = `x_signup_persona=${persona}; path=/; max-age=600; SameSite=Lax`;
                  signIn("google", { callbackUrl: "/auth/oauth-success" });
                }}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                data-testid="button-google-register"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar com Google
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 font-medium uppercase">ou</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Register Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              <HoneypotField value={antiBot.website} onChange={antiBot.setWebsite} />
              <div>
                <label className="text-sm font-medium mb-2 block">Nome completo</label>
                <div className="relative">
                  <IconPerson className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                    data-testid="input-name"
                    {...form.register("name")}
                  />
                </div>
                {nameError && (
                  <p className="text-xs text-red-500 mt-1" data-testid="text-name-error">{nameError}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <div className="relative">
                  <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                    data-testid="input-email"
                    {...form.register("email")}
                  />
                </div>
                {emailError && (
                  <p className="text-xs text-red-500 mt-1" data-testid="text-email-error">{emailError}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Usuário</label>
                <div className="relative">
                  <IconAlternateEmail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type="text"
                    placeholder="Seu nome de usuário"
                    autoComplete="username"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                    data-testid="input-username"
                    {...form.register("username")}
                  />
                </div>
                {usernameError && (
                  <p className="text-xs text-red-500 mt-1" data-testid="text-username-error">{usernameError}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Telefone</label>
                <div className="relative">
                  <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    autoComplete="tel"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                    data-testid="input-phone"
                    {...form.register("phone")}
                  />
                </div>
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1" data-testid="text-phone-error">{phoneError}</p>
                )}
              </div>
              {exigeCpfCnpj && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {somenteCnpj ? "CNPJ" : "CPF ou CNPJ"}
                  </label>
                  <div className="relative">
                    <IconBusiness className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder={somenteCnpj ? "00.000.000/0000-00" : "000.000.000-00"}
                      autoComplete="off"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[#333333]/20 dark:focus:ring-white/20"
                      data-testid="input-cpfcnpj"
                      value={formatCpfCnpj(cpfCnpjValue ?? "")}
                      onChange={(e) =>
                        form.setValue("cpfCnpj", e.target.value, {
                          shouldValidate: form.formState.isSubmitted,
                        })
                      }
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {somenteCnpj
                      ? "O cadastro de empreiteiro é de pessoa jurídica. Necessário para emitir cobranças e receber pagamentos das obras. "
                      : "Necessário para emitir cobranças e assinar planos. "}
                    Seus dados de pagamento são processados por um provedor externo de pagamentos.{" "}
                    <Link href="/politica-privacidade" className="underline hover:text-[#333333] dark:hover:text-white">
                      Saiba mais
                    </Link>.
                  </p>
                  {cpfCnpjError && (
                    <p className="text-xs text-red-500 mt-1" data-testid="text-cpfcnpj-error">{cpfCnpjError}</p>
                  )}
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-2 block">Senha</label>
                <PasswordInput
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  testId="input-password"
                  {...form.register("password")}
                />
                <PasswordStrengthMeter
                  password={passwordValue ?? ""}
                  context={{
                    name: nameValue ?? "",
                    email: emailValue ?? "",
                    username: usernameValue ?? "",
                  }}
                />
                {passwordError && (
                  <p className="text-xs text-red-500 mt-1" data-testid="text-password-error">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Terms */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-[#333333] focus:ring-[#333333]/20 mt-0.5"
                  data-testid="checkbox-terms"
                  {...form.register("acceptTerms")}
                />
                <span className="text-xs text-slate-500 leading-relaxed">
                  Aceito os{" "}
                  <Link href="/termos" className="font-bold text-[#333333] dark:text-white underline">
                    Termos de Uso
                  </Link>{" "}
                  e a{" "}
                  <Link href="/politica-privacidade" className="font-bold text-[#333333] dark:text-white underline">
                    Política de Privacidade
                  </Link>
                </span>
              </label>
              {termsError && (
                <p className="text-xs text-red-500 -mt-2" data-testid="text-terms-error">{termsError}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#333333] text-white font-bold py-3 rounded-full hover:brightness-110 transition-all disabled:opacity-50 text-sm"
                data-testid="button-register"
              >
                {isLoading ? "Cadastrando..." : "Criar conta"}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-slate-500 mt-8">
              Já tem conta?{" "}
              <Link
                href={`/login?perfil=${perfil}`}
                className="font-bold text-[#333333] dark:text-white hover:opacity-70 transition-opacity"
                data-testid="link-login"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
