"use client";

import Link from "next/link";
import { Building2, Wallet, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Building2,
    title: "Gestão de Obras",
    description: "Acompanhe o progresso de todas as suas obras em tempo real com dashboards intuitivos.",
  },
  {
    icon: Wallet,
    title: "Controle Financeiro",
    description: "Gerencie receitas, despesas e orçamentos de cada projeto de forma centralizada.",
  },
  {
    icon: Users,
    title: "Clientes e Empreiteiras",
    description: "Cadastre e gerencie seus clientes e empreiteiras em um só lugar.",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Visualize relatórios detalhados para tomar decisões estratégicas com confiança.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <section className="relative flex flex-col items-center justify-center px-4 py-32 md:py-44">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-800" />
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
          <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight" data-testid="text-hero-title">
            XConstrução
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-xl" data-testid="text-hero-subtitle">
            Plataforma completa de gestão de construção civil
          </p>
          <Link href="/login" data-testid="link-entrar">
            <Button size="lg" className="mt-4 text-base px-8">
              Entrar
            </Button>
          </Link>
        </div>
      </section>

      <section className="flex-1 px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-12" data-testid="text-features-title">
            Tudo que você precisa para gerenciar suas obras
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} data-testid={`card-feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}>
                <CardContent className="pt-6 flex flex-col items-center text-center gap-4">
                  <div className="p-3 rounded-md bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t px-4 py-6">
        <p className="text-center text-sm text-muted-foreground" data-testid="text-footer-copyright">
          &copy; {new Date().getFullYear()} XConstrução. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
