"use client";

import Link from "next/link";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { StructuredData } from "@features/landing/components/StructuredData";
import { generateProductSchema, generateBreadcrumbSchema, generateWebPageSchema } from '@features/landing/seo/seo-utils';
import { IconDashboardCustomize, IconPrecisionManufacturing, IconMonitoring, IconPayments, IconGroups, IconDescription, IconAnalytics, IconTableChart, IconSecurity, IconDevices } from '@shared/components/icons';
import { XGESTAO_LOGIN_HREF } from '@features/xgestao/routes';
import { Reveal } from '@features/landing/components/Reveal';
import { SiteTemaRaiz } from '@features/landing/components/SiteTemaRaiz';
import { RiArrowRightLine } from 'react-icons/ri';

const features = [
  {
    Icon: IconPrecisionManufacturing,
    title: "Orçamento da Obra",
    description:
      "Defina o orçamento de cada obra e acompanhe o gasto contra o previsto em um só lugar.",
  },
  {
    Icon: IconMonitoring,
    title: "Controle de Obras",
    description:
      "Acompanhe cada etapa com cronograma, diário de obra, fotos e registro de problemas.",
  },
  {
    Icon: IconPayments,
    title: "Gestão Financeira",
    description:
      "Controle entradas, saídas e o fluxo de caixa de cada obra em um só lugar.",
  },
  {
    Icon: IconGroups,
    title: "Equipe & Fornecedores",
    description:
      "Gerencie equipes, fornecedores e documentação técnica em uma plataforma centralizada.",
  },
  {
    Icon: IconDescription,
    title: "Documentação Digital",
    description:
      "Armazene e gerencie contratos, projetos, ART/RRT e laudos técnicos de forma segura na nuvem.",
  },
  {
    Icon: IconAnalytics,
    title: "Relatórios & Análises",
    description:
      "Gere relatórios personalizados com gráficos e métricas para tomada de decisão estratégica.",
  },
];

const differentials = [
  {
    Icon: IconTableChart,
    title: "Link Público para o Cliente",
    description:
      "Compartilhe o andamento da obra por link, sem o cliente precisar criar conta.",
    highlight: true,
  },
  {
    Icon: IconDashboardCustomize,
    title: "Tudo da Obra num Lugar",
    description:
      "Diário, fotos, financeiro, equipe e cronograma de cada obra reunidos, sem planilha solta.",
    highlight: false,
  },
  {
    Icon: IconSecurity,
    title: "Segurança Total",
    description:
      "Acesso protegido por login, permissões por pessoa da equipe e arquivos das obras privados.",
    highlight: false,
  },
  {
    Icon: IconDevices,
    title: "Multiplataforma",
    description:
      "Acesse de qualquer dispositivo: computador, tablet ou celular, direto no navegador.",
    highlight: false,
  },
];

export default function XGestaoInteligentePage() {
  return (
    <SiteTemaRaiz>
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300">
      <StructuredData data={[
        generateProductSchema(),
        generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'xgestão inteligente', url: '/xgestao-inteligente' }
        ]),
        generateWebPageSchema({
          title: 'xgestão inteligente - Gestão de Obras',
          description: 'Gestão de obras com diário, financeiro, fotos e link para o cliente acompanhar',
          url: '/xgestao-inteligente',
          datePublished: '2026-01-01',
        })
      ]} />
      <GlassNav />

      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-32 pb-20">
          {/* Background Overlay */}
          <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
            <div
              className="w-full h-full bg-cover bg-center opacity-[0.08]"
              style={{ backgroundImage: 'url("/images/background-homepage.png")' }}
            />
            {/* Funde a base do hero com a seção seguinte */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white to-transparent dark:from-[#1C1F22]" />
          </div>

          {/* Content */}
          <div className="relative z-10 max-w-[1000px] w-full flex flex-col items-center text-center gap-8">
            <Reveal y={8}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#333333]/10 ring-1 ring-black/5 text-[#333333] dark:bg-white/10 dark:ring-white/10 dark:text-white text-sm font-bold uppercase tracking-wider">
                <IconDashboardCustomize className="text-lg" aria-hidden="true" />
                <span>xgestão inteligente</span>
              </div>
            </Reveal>
            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-[-0.04em] leading-[0.95] break-words"
              data-testid="text-xgestao-title"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              Gestão de obras com{" "}
              <span className="text-[#333333] dark:text-white">inteligência</span>
            </h1>
            <Reveal y={8} delay={0.08}>
              <p className="text-lg sm:text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-[600px] leading-relaxed">
                Sistema completo para gerenciar orçamentos, equipes, financeiro e
                documentação da sua obra com precisão e eficiência.
              </p>
            </Reveal>
            <Reveal y={8} delay={0.16} className="w-full sm:w-auto">
              <div className="flex w-full flex-col sm:w-auto sm:flex-row gap-4 justify-center">
                <Link
                  href={XGESTAO_LOGIN_HREF}
                  className="group bg-[#333333] text-white dark:bg-white dark:text-[#1C1F22] w-full sm:w-auto font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center gap-2 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-[#1C1F22]"
                  data-testid="link-testar-gratis"
                >
                  Testar Grátis
                  <RiArrowRightLine className="text-lg transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
                <a
                  href="#funcionalidades"
                  className="bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white w-full sm:w-auto font-bold h-14 px-10 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 dark:hover:border-white/40 transition-all inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-[#1C1F22]"
                >
                  Ver Funcionalidades
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Funcionalidades */}
        <section id="funcionalidades" className="py-24 md:py-32 px-6 scroll-mt-20">
          <div className="max-w-[1200px] mx-auto">
            <Reveal className="flex flex-col md:flex-row justify-between md:items-end mb-16 md:mb-20 gap-8">
              <div className="max-w-[600px]">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 break-words">
                  Funcionalidades
                </h2>
                <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400">
                  Tudo que você precisa para gerenciar suas obras com eficiência e
                  controle total.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {features.map((feature, i) => (
                <Reveal key={feature.title} delay={i * 0.06} className="h-full">
                  <div className="group relative h-full rounded-3xl border border-black/[0.04] bg-[#F4F5F5] p-6 sm:p-8 flex flex-col min-h-[200px] transition-all duration-300 hover:-translate-y-1 hover:border-black/10 hover:bg-white hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] dark:border-white/5 dark:bg-[#2A2D30] dark:hover:border-white/15 dark:hover:bg-[#30343A]">
                    <div className="mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-white text-[#333333] shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 dark:bg-[#1C1F22] dark:text-white dark:ring-white/10">
                      <feature.Icon className="text-3xl" aria-hidden="true" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Diferenciais */}
        <section className="py-24 md:py-32 px-6 bg-[#F4F5F5] dark:bg-[#2A2D30] transition-colors duration-300">
          <div className="max-w-[1200px] mx-auto">
            <Reveal className="flex flex-col md:flex-row justify-between md:items-end mb-16 md:mb-20 gap-8">
              <div className="max-w-[600px]">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 break-words">
                  Diferenciais
                </h2>
                <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400">
                  O que torna a xgestão inteligente única no mercado.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {differentials.map((diff, i) => (
                <Reveal key={diff.title} delay={i * 0.06} className="h-full">
                  <div
                    className={`group relative h-full overflow-hidden rounded-3xl p-6 sm:p-8 flex flex-col min-h-[180px] transition-all duration-300 hover:-translate-y-1 ${
                      diff.highlight
                        ? "bg-[#333333] text-white hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] dark:ring-1 dark:ring-white/10"
                        : "border border-black/[0.04] bg-white hover:border-black/10 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] dark:border-white/5 dark:bg-[#1C1F22] dark:hover:border-white/15 dark:hover:bg-[#22262A]"
                    }`}
                  >
                    {diff.highlight && (
                      <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
                    )}
                    <div
                      className={`relative mb-6 inline-flex size-14 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover:scale-105 ${
                        diff.highlight
                          ? "bg-white/10 text-white ring-white/15"
                          : "bg-[#F4F5F5] text-[#333333] shadow-sm ring-black/5 dark:bg-[#2A2D30] dark:text-white dark:ring-white/10"
                      }`}
                    >
                      <diff.Icon className="text-3xl" aria-hidden="true" />
                    </div>
                    <h3 className="relative text-lg font-bold mb-2">{diff.title}</h3>
                    <p
                      className={`relative text-sm leading-relaxed ${
                        diff.highlight
                          ? "text-white/70"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {diff.description}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="relative py-24 md:py-32 px-6 bg-[#333333] text-white overflow-hidden">
          {/* Textura sutil: grade branca mascarada no centro */}
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
            aria-hidden="true"
          />
          <Reveal className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.04em] leading-[0.95] mb-6">
              Comece agora
            </h2>
            <p className="text-lg sm:text-xl opacity-80 max-w-[600px] mx-auto mb-12 font-light">
              Experimente a xgestão inteligente gratuitamente por 3 meses e
              descubra o poder de uma gestão transparente e eficiente.
            </p>
            <div className="flex flex-col sm:flex-row justify-center">
              <Link
                href={XGESTAO_LOGIN_HREF}
                className="group w-full sm:w-auto bg-white text-[#333333] font-bold h-14 px-10 rounded-full hover:scale-105 transition-transform inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#333333]"
                data-testid="link-cta-teste"
              >
                Teste Grátis
                <RiArrowRightLine className="text-lg transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" aria-hidden="true" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" aria-hidden="true" />
        </section>
      </main>

      <SiteFooter />
    </div>
    </SiteTemaRaiz>
  );
}
