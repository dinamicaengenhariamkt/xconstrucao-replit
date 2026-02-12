import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, HardHat, ShieldCheck, ArrowRight } from "lucide-react";

const profiles = [
  {
    key: "contratante",
    icon: Building2,
    title: "Contratante",
    description: "Dono da obra que contrata empreiteiros para executar projetos de construção.",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    key: "empreiteiro",
    icon: HardHat,
    title: "Empreiteiro",
    description: "Executor especializado que realiza as obras com qualidade e pontualidade.",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    key: "admin",
    icon: ShieldCheck,
    title: "Administrador",
    description: "Gestão completa da plataforma, clientes, empreiteiras e finanças.",
    color: "bg-primary/10 text-primary",
  },
];

export default function AccessPage() {
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
        <div className="w-full max-w-2xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3" data-testid="text-access-title">
              Acesso à Plataforma
            </h1>
            <p className="text-muted-foreground">Selecione seu perfil para continuar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {profiles.map((p) => (
              <Link key={p.key} href={`/login?perfil=${p.key}`}>
                <Card className="p-6 border-border cursor-pointer hover:-translate-y-1 transition-all duration-200 h-full group" data-testid={`card-profile-${p.key}`}>
                  <div className={`w-12 h-12 rounded-md flex items-center justify-center mb-4 ${p.color}`}>
                    <p.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{p.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed mb-4">{p.description}</p>
                  <div className="flex items-center gap-1 text-primary text-sm font-semibold group-hover:gap-2 transition-all">
                    <span>Acessar</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
