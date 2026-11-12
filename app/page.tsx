"use client";

import Link from "next/link";
import Image from "next/image";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import {
  IconShield,
  IconDashboardCustomize,
  IconTarget,
  IconBolt,
  IconArrowForward,
  IconPrecisionManufacturing,
  IconMonitoring,
  IconPayments,
  IconGroups,
  IconDescription,
  IconAnalytics,
} from '@shared/components/icons';
import { StructuredData } from "@features/landing/components/StructuredData";
import { generateBreadcrumbSchema, generateWebPageSchema } from '@features/landing/seo/seo-utils';
import { AdSidebarSlot } from "@features/shared/anuncios/components/AdSidebarSlot";
import { ObrasDestaqueCarousel } from "@features/landing/components/ObrasDestaqueCarousel";
import { MercadoEmFoco } from "@features/landing/components/MercadoEmFoco";
import { AnuncieAqui } from "@features/landing/components/AnuncieAqui";
import { usePublicConfig } from "@features/shared/hooks/use-public-config";
import { XGESTAO_LOGIN_HREF } from "@features/xgestao/routes";
import { InstalarAppSecao } from "@features/landing/components/InstalarAppSecao";
import { Reveal } from "@features/landing/components/Reveal";
import { SiteTemaRaiz } from "@features/landing/components/SiteTemaRaiz";

const FOCO =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 focus-visible:ring-offset-2 dark:focus-visible:ring-white/40 dark:focus-visible:ring-offset-[#1C1F22]";

const CARD =
  "group relative rounded-3xl border border-black/[0.04] bg-[#F4F5F5] transition-all duration-300 hover:-translate-y-1 hover:border-black/10 hover:bg-white hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] dark:border-white/5 dark:bg-[#2A2D30] dark:hover:border-white/15 dark:hover:bg-[#30343A]";

const TILE =
  "mb-6 inline-flex size-14 items-center justify-center rounded-2xl bg-white text-[#333333] shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 dark:bg-[#1C1F22] dark:text-white dark:ring-white/10";

/** Mesmas funcionalidades (nome e ícone) da página /xgestao-inteligente. */
const FUNCIONALIDADES_XGESTAO = [
  { Icon: IconPrecisionManufacturing, title: "Orçamento da Obra" },
  { Icon: IconMonitoring, title: "Controle de Obras" },
  { Icon: IconPayments, title: "Gestão Financeira" },
  { Icon: IconGroups, title: "Equipe & Fornecedores" },
  { Icon: IconDescription, title: "Documentação Digital" },
  { Icon: IconAnalytics, title: "Relatórios & Análises" },
];

/** Conteúdo do card do xgestão (igual no card comum e no card destaque). */
function XgestaoConteudo() {
  return (
    <>
      <span className={TILE}>
        <IconDashboardCustomize className="text-3xl" aria-hidden="true" />
      </span>
      <div className="flex-1 flex flex-col">
        <h3 className="text-xl md:text-2xl font-extrabold mb-1">
          xgestão inteligente
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium italic mb-5">
          (Solução ativa — já disponível)
        </p>
        <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-4">
          Sistema de gestão de obras com acompanhamento de progresso,
          planejamento e uma visão centralizada da execução.
          Controle e previsibilidade desde o primeiro dia.
        </p>
        <p className="text-slate-700 dark:text-slate-200 text-sm font-bold mb-8">
          Teste grátis por 3 meses
        </p>
        <div className="mt-auto">
          <Link
            href="/cadastro?perfil=xgestao"
            prefetch={false}
            className={`group/btn bg-[#333333] text-white dark:bg-white dark:text-[#1C1F22] w-full sm:w-auto justify-center text-center font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all inline-flex items-center gap-2 text-sm dark:ring-1 dark:ring-white/15 ${FOCO}`}
            data-testid="link-comecar-xgestao"
          >
            Começar com xgestão inteligente
            <IconArrowForward
              className="transition-transform group-hover/btn:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </>
  );
}

const INOVACAO = [
  {
    Icon: IconShield,
    title: "Segurança e agilidade",
    text: "Na xconstrução, a relação é segura do começo ao fim: pagamentos só após comprovação, profissionais com histórico verificado e transparência total em cada etapa. Acabou a desconfiança — a obra anda com segurança para todos.",
  },
  {
    Icon: IconTarget,
    title: "Precisão digital e previsibilidade",
    text: "Dados em tempo real para decisões assertivas, eliminando erros comuns em grandes cronogramas.",
  },
  {
    Icon: IconBolt,
    title: "Gestão ágil e monitorada",
    text: "Interface intuitiva e colaborativa para otimizar cronogramas e recursos. Com clareza total em todas as etapas, todos trabalham em sincronia. Bem-vindo à nova dinâmica da construção.",
  },
];

export default function HomePage() {
  const { config, isLoading } = usePublicConfig();
  // Marketplace oculto: o card do xgestão ocupa a largura toda (sem metade vazia).
  // Em produção o marketplace está oculto: o card largo já aparece durante o
  // carregamento da config, sem salto de layout quando ela chega.
  const xgestaoDestaque = isLoading || !config.marketplaceVisivel;

  return (
    <SiteTemaRaiz>
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300">
      <StructuredData data={[
        generateBreadcrumbSchema([{ name: 'Home', url: '/' }]),
        generateWebPageSchema({
          title: 'Reinventando as relações na construção civil',
          description: 'Conectamos projetos a executores de excelência com praticidade, precisão e previsibilidade',
          url: '/',
          datePublished: '2026-01-01',
          dateModified: '2026-02-13',
        })
      ]} />
      <GlassNav />

      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <section
          id="inicio"
          className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-32 text-center"
        >
          {/* Fundo: grade bem leve, some nas bordas */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_30%,black_20%,transparent_75%)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-24 size-[640px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(0,0,0,0.04),transparent_65%)] dark:bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_65%)]"
          />

          {/* Content */}
          <div className="relative z-10 max-w-[1000px] w-full pb-16">
            <Image
              src="/images/logo-xconstrucao-vertical-01.png"
              alt="XConstrução"
              width={600}
              height={300}
              className="h-24 w-auto mx-auto mb-8 dark:invert"
              priority
            />
            <h1
              className="text-4xl sm:text-5xl md:text-7xl break-words font-extrabold tracking-[-0.04em] leading-[0.95] mb-6"
              data-testid="text-hero-title"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              Reinventando as relações na{" "}
              <span className="text-[#333333] dark:text-slate-300">construção civil</span>
            </h1>
            <p
              className="text-lg sm:text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-[700px] mx-auto leading-relaxed mb-12"
              data-testid="text-hero-subtitle"
            >
              Conectamos projetos a executores de excelência, com praticidade,
              precisão, previsibilidade e inovação em cada etapa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoading ? (
                <div
                  className="flex w-full flex-col sm:w-auto sm:flex-row gap-4 justify-center"
                  role="status"
                  aria-label="Carregando opções de acesso"
                >
                  <div className="h-14 w-full sm:w-52 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-14 w-full sm:w-52 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              ) : config.marketplaceVisivel ? (
                <>
                  <Link
                    href="/login?perfil=empreiteiro"
                    prefetch={false}
                    className={`bg-[#333333] text-white dark:bg-white dark:text-[#1C1F22] w-full sm:w-auto font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center dark:ring-1 dark:ring-white/15 ${FOCO}`}
                    data-testid="link-sou-empreiteiro"
                  >
                    Sou Empreiteiro
                  </Link>
                  <Link
                    href="/login?perfil=contratante"
                    prefetch={false}
                    className={`bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white w-full sm:w-auto font-bold h-14 px-10 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center ${FOCO}`}
                    data-testid="link-sou-contratante"
                  >
                    Sou Contratante
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href={XGESTAO_LOGIN_HREF}
                    prefetch={false}
                    className={`group bg-[#333333] text-white dark:bg-white dark:text-[#1C1F22] w-full sm:w-auto font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center gap-2 dark:ring-1 dark:ring-white/15 ${FOCO}`}
                    data-testid="link-acessar-xgestao"
                  >
                    Acessar xgestão
                    <IconArrowForward
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                  <Link
                    href="/cadastro?perfil=xgestao"
                    prefetch={false}
                    className={`bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white w-full sm:w-auto font-bold h-14 px-10 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center ${FOCO}`}
                    data-testid="link-criar-conta-xgestao"
                  >
                    Criar conta xgestão
                  </Link>
                </>
              )}
            </div>
            {/* Imagem ilustrativa (sem animação: pode ser o LCP no desktop) */}
            <div className="mt-12 w-full">
              <Image
                src="/images/bg-homepage-dark.png"
                alt="Ilustração XConstrução"
                width={1000}
                height={600}
                className="w-full h-auto rounded-3xl shadow-[0_40px_80px_-40px_rgba(0,0,0,0.35)] ring-1 ring-black/5 dark:ring-white/10"
              />
            </div>
          </div>
        </section>

        {/* Parceiros / Trust Bar — OCULTO em stand-by até termos parceiros reais.
            Reativar removendo o comentário e substituindo os placeholders pelos logos.
        <section className="py-24 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-20 gap-8">
              <div className="max-w-[600px]">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 break-words">
                  Nossos <br />
                  Parceiros
                </h2>
                <p className="text-lg sm:text-xl text-slate-500">
                  Confiado pelas maiores empresas do mercado.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-12 opacity-40 grayscale items-center justify-items-center">
              {["Parceiro 1", "Parceiro 2", "Parceiro 3", "Parceiro 4", "Parceiro 5"].map(
                (partner) => (
                  <div
                    key={partner}
                    className="h-8 w-32 bg-slate-400 rounded-sm"
                  ></div>
                )
              )}
            </div>
          </div>
        </section>
        */}

        {/* Nossas Soluções */}
        <section id="solucoes" className="py-24 md:py-32 px-6 scroll-mt-24">
          <div className="max-w-[1200px] mx-auto">
            <Reveal className="flex flex-col md:flex-row justify-between md:items-end mb-16 md:mb-20 gap-8">
              <div className="max-w-[600px]">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 break-words">
                  Nossas <br />
                  Soluções
                </h2>
                <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400">
                  Tecnologia que acelera suas obras, do planejamento ao fechamento.
                </p>
              </div>
            </Reveal>
            <div
              className={`grid grid-cols-1 gap-8 ${xgestaoDestaque ? "" : "md:grid-cols-2"}`}
              data-testid="solutions-grid"
            >
              {xgestaoDestaque ? (
                /* Card destaque: xgestão sozinho, largura total */
                <Reveal>
                  <div
                    className="group relative grid grid-cols-1 gap-10 overflow-hidden rounded-3xl border border-black/[0.04] bg-[#F4F5F5] p-6 transition-all duration-300 hover:border-black/10 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] sm:p-8 md:p-12 lg:grid-cols-2 lg:gap-12 dark:border-white/5 dark:bg-[#2A2D30] dark:hover:border-white/15"
                    data-testid="solution-card-xgestao"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-black/[0.04] blur-3xl dark:bg-white/10"
                    />
                    <div className="relative flex flex-col">
                      <XgestaoConteudo />
                    </div>

                    {/* Painel visual: funcionalidades do xgestão */}
                    <div className="relative flex flex-col rounded-2xl border border-black/[0.05] bg-white p-4 shadow-sm sm:p-6 md:p-8 dark:border-white/10 dark:bg-[#1C1F22]">
                      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        {FUNCIONALIDADES_XGESTAO.map(({ Icon, title }) => (
                          <li
                            key={title}
                            className="flex min-w-0 items-center gap-3 rounded-xl border border-black/[0.05] bg-[#F4F5F5] px-3 py-3 text-sm font-bold leading-snug text-[#333333] dark:border-white/10 dark:bg-[#2A2D30] dark:text-white"
                          >
                            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#333333] ring-1 ring-black/5 dark:bg-[#1C1F22] dark:text-white dark:ring-white/10">
                              <Icon className="text-lg" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">{title}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex justify-end lg:mt-auto lg:pt-6">
                        <Link
                          href="/xgestao-inteligente#funcionalidades"
                          prefetch={false}
                          className={`group/ver inline-flex items-center gap-1.5 rounded-full text-sm font-bold text-slate-600 underline-offset-4 transition-colors hover:text-[#333333] hover:underline dark:text-slate-300 dark:hover:text-white ${FOCO}`}
                        >
                          Ver Funcionalidades
                          <IconArrowForward
                            className="transition-transform group-hover/ver:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ) : (
                <>
                  {/* Card xgestão inteligente */}
                  <Reveal className="h-full">
                    <div
                      className={`${CARD} flex h-full min-h-[360px] flex-col p-6 sm:p-8 md:p-10`}
                      data-testid="solution-card-xgestao"
                    >
                      <XgestaoConteudo />
                    </div>
                  </Reveal>

                  {!isLoading && config.marketplaceVisivel && (
                    <Reveal className="h-full" delay={0.08}>
                      <div
                        className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col min-h-[360px] h-full"
                        style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
                        data-testid="solution-card-marketplace"
                      >
                        <IconBolt className="text-5xl text-[#7C3AED] mb-6" />
                        <div className="flex-1 flex flex-col">
                          <h3 className="text-xl md:text-2xl font-extrabold mb-1">
                            Marketplace xconstrução
                          </h3>
                          <p className="text-[#7C3AED] text-sm font-medium italic mb-5">
                            (disponível)
                          </p>
                          <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-4">
                            Conexão direta entre contratantes e empreiteiros qualificados,
                            com intermediação segura e oportunidades exclusivas.
                          </p>
                          <div className="mt-auto">
                            <Link
                              href="/acesso-plataforma"
                              prefetch={false}
                              className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold px-8 py-3 rounded-full transition-colors inline-flex items-center text-sm"
                              data-testid="link-acessar-marketplace"
                            >
                              Acessar marketplace
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Bento Features - Inovação em cada etapa */}
        <section className="py-24 md:py-32 px-6 bg-[#fcfcfc] dark:bg-[#17191C]">
          <div className="max-w-[1200px] mx-auto">
            <Reveal className="flex flex-col md:flex-row justify-between md:items-end mb-16 md:mb-20 gap-8">
              <div className="max-w-[600px]">
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 break-words">
                  Inovação em <br />
                  cada etapa
                </h2>
                <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400">
                  Nossa plataforma oferece as ferramentas necessárias para
                  transformar a gestão de obras complexas.
                </p>
              </div>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {INOVACAO.map(({ Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 0.08} className="h-full">
                  <div className={`${CARD} flex h-full min-h-[300px] flex-col p-6 sm:p-8 lg:p-10`}>
                    <span className={TILE}>
                      <Icon className="text-3xl" aria-hidden="true" />
                    </span>
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-2xl font-extrabold mb-3">{title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                        {text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Projetos em Destaque — curadoria dinâmica do admin (J25). Some quando vazio. */}
        {!isLoading && config.marketplaceVisivel && <ObrasDestaqueCarousel />}

        {/* Mercado em Foco — vitrine dinâmica de anúncios (J24). Some quando vazia. */}
        {!isLoading && config.marketplaceVisivel && <MercadoEmFoco />}

        {/* Slot de anúncio público (J16) — invisível enquanto não há campanha ativa */}
        {!isLoading && config.marketplaceVisivel && (
          <div className="max-w-[420px] mx-auto px-6">
            <AdSidebarSlot zoneId="banner-qa" />
          </div>
        )}

        {/* J23 — convite para anunciar (self-service) */}
        {!isLoading && config.marketplaceVisivel && <AnuncieAqui />}

        {/* PWA — instalar o xgestão no celular (QR code no computador). */}
        <InstalarAppSecao />

        {/* CTA Final */}
        <section className="relative py-24 md:py-32 px-6 bg-[#333333] text-white overflow-hidden">
          {/* Textura: grade branca bem leve, mascarada no centro */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,black_10%,transparent_75%)]"
          />
          <Reveal className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[-0.04em] leading-[0.95] mb-6">
              Pronto para o próximo nível?
            </h2>
            <p className="text-lg sm:text-xl opacity-80 max-w-[600px] mx-auto mb-12 font-light">
              Organize suas obras com mais controle, clareza e previsibilidade em um só lugar.
            </p>
            <div className="flex flex-col sm:flex-row justify-center">
              <Link
                href="/xgestao-inteligente"
                prefetch={false}
                className="group bg-white text-[#333333] w-full sm:w-auto font-bold h-14 px-10 rounded-full hover:scale-105 transition-transform inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#333333]"
                data-testid="link-cta-acesso"
              >
                Acessar xgestão inteligente
                <IconArrowForward
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </Reveal>
          <div aria-hidden="true" className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent" />
          <div aria-hidden="true" className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </section>
      </main>

      <SiteFooter />
    </div>
    </SiteTemaRaiz>
  );
}
