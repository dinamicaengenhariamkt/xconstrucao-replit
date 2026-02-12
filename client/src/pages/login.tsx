import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Building2, HardHat, ShieldCheck, ArrowLeft, Eye, EyeOff } from "lucide-react";

const loginFormSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

type LoginForm = z.infer<typeof loginFormSchema>;

const profileConfig: Record<string, { icon: typeof Building2; label: string }> = {
  contratante: { icon: Building2, label: "Contratante" },
  empreiteiro: { icon: HardHat, label: "Empreiteiro" },
  admin: { icon: ShieldCheck, label: "Administrador" },
};

export default function LoginPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const perfil = params.get("perfil") || "contratante";
  const profile = profileConfig[perfil] || profileConfig.contratante;
  const ProfileIcon = profile.icon;

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsSubmitting(true);
    try {
      await login(data.email, data.password);
      toast({ title: "Login realizado com sucesso!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao entrar",
        description: error.message || "Verifique suas credenciais",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-center py-4 px-6">
        <nav className="flex items-center justify-between gap-4 w-full max-w-[1200px] px-8 py-3 rounded-full border border-white/20 dark:border-white/10 bg-white/70 dark:bg-[#1C1F22]/70 backdrop-blur-xl shadow-sm">
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-md bg-foreground flex items-center justify-center">
                <span className="text-background font-extrabold text-sm">X</span>
              </div>
              <span className="text-lg font-extrabold tracking-tight">xconstrução</span>
            </div>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="rounded-full" data-testid="button-back-home">
              Voltar ao início
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-16">
        <div className="w-full max-w-md">
          <Card className="p-8 border-border">
            <CardContent className="p-0">
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider" data-testid="badge-profile">
                  <ProfileIcon className="w-4 h-4" />
                  <span>{profile.label}</span>
                </div>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2" data-testid="text-login-title">Login</h1>
                <p className="text-muted-foreground text-sm">Acesse sua conta</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Email</Label>
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    className="rounded-xl py-3"
                    data-testid="input-email"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="rounded-xl py-3 pr-10"
                      data-testid="input-password"
                      {...form.register("password")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full rounded-full font-bold min-h-12 mt-2"
                  disabled={isSubmitting}
                  data-testid="button-submit-login"
                >
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs text-muted-foreground font-medium">ou</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              {perfil !== "admin" && (
                <p className="text-center text-sm text-muted-foreground" data-testid="text-register-link">
                  Ainda não tem conta?{" "}
                  <Link href={`/register?role=${perfil}`}>
                    <span className="font-bold text-primary hover:underline cursor-pointer">
                      Cadastre-se
                    </span>
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link href="/access">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer" data-testid="link-back-profile">
                <ArrowLeft className="w-4 h-4" />
                Voltar para seleção de perfil
              </span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
