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
import { Building2, HardHat, ArrowLeft, Eye, EyeOff } from "lucide-react";

const registerFormSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  phone: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const role = params.get("role") || "contratante";
  const isEmpreiteiro = role === "empreiteiro";
  const Icon = isEmpreiteiro ? HardHat : Building2;
  const label = isEmpreiteiro ? "Empreiteiro" : "Contratante";

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: "", email: "", username: "", password: "", phone: "" },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsSubmitting(true);
    try {
      await registerUser({ ...data, role });
      toast({ title: "Cadastro realizado com sucesso!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Tente novamente",
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
            <Button variant="ghost" className="rounded-full" data-testid="button-back-home">Voltar ao início</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pt-32 pb-16">
        <div className="w-full max-w-md">
          <Card className="p-8 border-border">
            <CardContent className="p-0">
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold uppercase tracking-wider" data-testid="badge-role">
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </div>
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight mb-2" data-testid="text-register-title">Cadastro</h1>
                <p className="text-muted-foreground text-sm">Crie sua conta na plataforma</p>
              </div>

              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Nome completo</Label>
                  <Input placeholder="Seu nome" className="rounded-xl py-3" data-testid="input-name" {...form.register("name")} />
                  {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Email</Label>
                  <Input type="email" placeholder="seu@email.com" className="rounded-xl py-3" data-testid="input-email" {...form.register("email")} />
                  {form.formState.errors.email && <p className="text-destructive text-xs mt-1">{form.formState.errors.email.message}</p>}
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Nome de usuário</Label>
                  <Input placeholder="seunome123" className="rounded-xl py-3" data-testid="input-username" {...form.register("username")} />
                  {form.formState.errors.username && <p className="text-destructive text-xs mt-1">{form.formState.errors.username.message}</p>}
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">Telefone (opcional)</Label>
                  <Input placeholder="(11) 99999-9999" className="rounded-xl py-3" data-testid="input-phone" {...form.register("phone")} />
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
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && <p className="text-destructive text-xs mt-1">{form.formState.errors.password.message}</p>}
                </div>

                <Button type="submit" className="w-full rounded-full font-bold min-h-12 mt-2" disabled={isSubmitting} data-testid="button-submit-register">
                  {isSubmitting ? "Cadastrando..." : "Criar conta"}
                </Button>
              </form>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border"></div>
                <span className="text-xs text-muted-foreground font-medium">ou</span>
                <div className="flex-1 h-px bg-border"></div>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{" "}
                <Link href={`/login?perfil=${role}`}>
                  <span className="font-bold text-primary hover:underline cursor-pointer" data-testid="link-login">Entrar</span>
                </Link>
              </p>
            </CardContent>
          </Card>

          <div className="text-center mt-6">
            <Link href="/access">
              <span className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
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
