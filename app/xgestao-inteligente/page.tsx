"use client";

import Link from "next/link";
import { GlassNav } from "@/components/glass-nav";
import { SiteFooter } from "@/components/site-footer";

const features = [
  {
    icon: "precision_manufacturing",
    title: "Orçamento Inteligente",
    description:
      "Crie orçamentos detalhados com base na tabela SINAPI, ajustando automaticamente os valores por região.",
  },
  {
    icon: "monitoring",
    title: "Controle de Obras",
    description:
      "Acompanhe o progresso de cada etapa com dashboards interativos e notificações em tempo real.",
  },
  {
    icon: "payments",
    title: "Gestão Financeira",
    description:
      "Controle entradas, saídas e fluxo de caixa com relatórios automatizados e alertas inteligentes.",
  },
  {
    icon: "groups",
    title: "Equipe & Fornecedores",
    description:
      "Gerencie equipes, fornecedores e documentação técnica em uma plataforma centralizada.",
  },
  {
    icon: "description",
    title: "Documentação Digital",
    description:
      "Armazene e gerencie contratos, projetos, ART/RRT e laudos técnicos de forma segura na nuvem.",
  },
  {
    icon: "analytics",
    title: "Relatórios & Análises",
    description:
      "Gere relatórios personalizados com gráficos e métricas para tomada de decisão estratégica.",
  },
];

const differentials = [
  {
    icon: "table_chart",
    title: "SINAPI Integrado",
    description:
      "Tabela SINAPI atualizada automaticamente em todos os planos, sem custos adicionais.",
    highlight: true,
  },
  {
    icon: "smart_toy",
    title: "IA para Construção",
    description:
      "Inteligência artificial aplicada para otimizar custos, prazos e recursos dos seus projetos.",
    highlight: false,
  },
  {
    icon: "security",
    title: "Segurança Total",
    description:
      "Dados protegidos com criptografia de ponta e backups automáticos garantem a segurança das informações.",
    highlight: false,
  },
  {
    icon: "devices",
    title: "Multiplataforma",
    description:
      "Acesse de qualquer dispositivo — desktop, tablet ou smartphone — com sincronização em tempo real.",
    highlight: false,
  },
];

export default function XGestaoInteligentePage() {
  return (
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300">
      <GlassNav />

      <main className="relative pt-32 overflow-hidden">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
          <div className="max-w-[900px] w-full">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#333333]/10 text-[#333333] dark:text-white text-sm font-bold uppercase tracking-wider mb-8">
              <span className="material-symbols-outlined text-lg">dashboard_customize</span>
              <span>xgestão inteligente</span>
            </div>
            <h1
              className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] leading-[0.95] mb-6"
              data-testid="text-xgestao-title"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              Gestão de obras com{" "}
              <span className="text-[#333333]">inteligência</span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium max-w-[600px] mx-auto leading-relaxed mb-12">
              Sistema completo para gerenciar orçamentos, equipes, financeiro e
              documentação da sua obra com precisão e eficiência.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/acesso-plataforma"
                className="bg-[#333333] text-white font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center"
                data-testid="link-testar-gratis"
              >
                Testar Grátis
              </Link>
              <a
                href="#funcionalidades"
                className="bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white font-bold h-14 px-10 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center"
              >
                Ver Funcionalidades
              </a>
            </div>
          </div>
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" className="py-20 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.03em] mb-4 text-center">
              Funcionalidades
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 text-center mb-16 max-w-[600px] mx-auto">
              Tudo que você precisa para gerenciar suas obras com eficiência e
              controle total.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-8 flex flex-col min-h-[200px]"
                  style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
                >
                  <span className="material-symbols-outlined text-4xl text-[#333333] dark:text-white mb-4">
                    {feature.icon}
                  </span>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="py-20 px-6 bg-[#F4F5F5] dark:bg-[#2A2D30]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.03em] mb-4 text-center">
              Diferenciais
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 text-center mb-16 max-w-[600px] mx-auto">
              O que torna a xgestão inteligente única no mercado.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {differentials.map((diff) => (
                <div
                  key={diff.title}
                  className={`rounded-2xl p-8 flex flex-col min-h-[180px] ${
                    diff.highlight
                      ? "bg-[#333333] text-white"
                      : "bg-white dark:bg-[#1C1F22] border border-slate-100 dark:border-slate-800"
                  }`}
                  style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
                >
                  <span
                    className={`material-symbols-outlined text-4xl mb-4 ${
                      diff.highlight ? "text-white" : "text-[#333333] dark:text-white"
                    }`}
                  >
                    {diff.icon}
                  </span>
                  <h3 className="text-lg font-bold mb-2">{diff.title}</h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      diff.highlight
                        ? "text-white/70"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {diff.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="relative py-32 px-6 bg-[#333333] text-white overflow-hidden">
          <div className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] leading-[0.95] mb-6">
              Comece agora
            </h2>
            <p className="text-xl opacity-80 max-w-[600px] mx-auto mb-12 font-light">
              Experimente a xgestão inteligente gratuitamente por 3 meses e
              descubra o poder de uma gestão transparente e eficiente.
            </p>
            <div className="flex justify-center">
              <Link
                href="/acesso-plataforma"
                className="bg-white text-[#333333] font-bold h-14 px-10 rounded-full hover:scale-105 transition-transform inline-flex items-center justify-center"
                data-testid="link-cta-teste"
              >
                Teste Grátis
              </Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
