"use client";

import Link from "next/link";
import Image from "next/image";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { IconShield, IconDashboardCustomize, IconTarget, IconBolt } from '@shared/components/icons';
import { StructuredData } from "@features/landing/components/StructuredData";
import { generateBreadcrumbSchema, generateWebPageSchema } from '@features/landing/seo/seo-utils';
import { AdSidebarSlot } from "@features/shared/anuncios/components/AdSidebarSlot";
import { ObrasDestaqueCarousel } from "@features/landing/components/ObrasDestaqueCarousel";
import { MercadoEmFoco } from "@features/landing/components/MercadoEmFoco";
import { AnuncieAqui } from "@features/landing/components/AnuncieAqui";
import { usePublicConfig } from "@features/shared/hooks/use-public-config";

export default function HomePage() {
  const { config, isLoading } = usePublicConfig();

  return (
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
          {/* Content */}
          <div className="relative z-10 max-w-[1000px] w-full pb-16">
            <Image
              src="/images/logo-xconstrucao-vertical-01.png"
              alt="XConstrução"
              width={600}
              height={300}
              className="h-24 w-auto mx-auto mb-8"
              priority
            />
            <h1
              className="text-5xl md:text-7xl font-extrabold tracking-[-0.04em] leading-[0.95] mb-6"
              data-testid="text-hero-title"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              Reinventando as relações na{" "}
              <span className="text-[#333333]">construção civil</span>
            </h1>
            <p
              className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium max-w-[700px] mx-auto leading-relaxed mb-12"
              data-testid="text-hero-subtitle"
            >
              Conectamos projetos a executores de excelência, com praticidade,
              precisão, previsibilidade e inovação em cada etapa.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isLoading ? (
                <div
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                  role="status"
                  aria-label="Carregando opções de acesso"
                >
                  <div className="h-14 w-52 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                  <div className="h-14 w-52 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              ) : config.marketplaceVisivel ? (
                <>
                  <Link
                    href="/login?perfil=empreiteiro"
                    prefetch={false}
                    className="bg-[#333333] text-white font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center"
                    data-testid="link-sou-empreiteiro"
                  >
                    Sou Empreiteiro
                  </Link>
                  <Link
                    href="/login?perfil=contratante"
                    prefetch={false}
                    className="bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white font-bold h-14 px-10 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center"
                    data-testid="link-sou-contratante"
                  >
                    Sou Contratante
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login?perfil=xgestao&next=%2Fxgestao%2Fobras"
                    prefetch={false}
                    className="bg-[#333333] text-white font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center"
                    data-testid="link-acessar-xgestao"
                  >
                    Acessar xgestão
                  </Link>
                  <Link
                    href="/cadastro?perfil=xgestao"
                    prefetch={false}
                    className="bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white font-bold h-14 px-10 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center"
                    data-testid="link-criar-conta-xgestao"
                  >
                    Criar conta xgestão
                  </Link>
                </>
              )}
            </div>
            {/* Imagem ilustrativa */}
            <div className="mt-12 w-full">
              <Image
                src="/images/bg-homepage-dark.png"
                alt="Ilustração XConstrução"
                width={1000}
                height={600}
                className="w-full h-auto rounded-2xl"
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
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                  Nossos <br />
                  Parceiros
                </h2>
                <p className="text-xl text-slate-500">
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
        <section id="solucoes" className="py-32 px-6 scroll-mt-24">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-20 gap-8">
              <div className="max-w-[600px]">
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                  Nossas <br />
                  Soluções
                </h2>
                <p className="text-xl text-slate-500">
                  Tecnologia que acelera suas obras, do planejamento ao fechamento.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card xgestão inteligente */}
              <div
                className={`bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col min-h-[360px] ${
                  !config.marketplaceVisivel ? "md:col-span-2 md:max-w-[586px] md:w-full md:mx-auto" : ""
                }`}
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <IconDashboardCustomize className="text-5xl text-[#333333] dark:text-white mb-6" />
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
                    Comece pelo plano Freemium
                  </p>
                  <div className="mt-auto">
                    <Link
                      href="/cadastro?perfil=xgestao"
                      prefetch={false}
                      className="bg-[#333333] text-white font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all inline-flex items-center text-sm"
                      data-testid="link-comecar-xgestao"
                    >
                      Começar com xgestão inteligente
                    </Link>
                  </div>
                </div>
              </div>

              {!isLoading && config.marketplaceVisivel && (
                <div
                  className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col min-h-[360px]"
                  style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
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
              )}
            </div>
          </div>
        </section>

        {/* Bento Features - Inovação em cada etapa */}
        <section className="py-32 px-6 bg-[#fcfcfc] dark:bg-background-dark/50">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-20 gap-8">
              <div className="max-w-[600px]">
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                  Inovação em <br />
                  cada etapa
                </h2>
                <p className="text-xl text-slate-500">
                  Nossa plataforma oferece as ferramentas necessárias para
                  transformar a gestão de obras complexas.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col min-h-[300px]"
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <IconShield className="text-5xl text-[#333333] dark:text-white mb-6" />
                <div className="flex-1 flex flex-col">
                  <h3 className="text-2xl font-extrabold mb-3">Segurança e agilidade</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Na xconstrução, a relação é segura do começo ao fim: pagamentos só após comprovação, profissionais com histórico verificado e transparência total em cada etapa. Acabou a desconfiança — a obra anda com segurança para todos.
                  </p>
                </div>
              </div>

              <div
                className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col min-h-[300px]"
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <IconTarget className="text-5xl text-[#333333] dark:text-white mb-6" />
                <div className="flex-1 flex flex-col">
                  <h3 className="text-2xl font-extrabold mb-3">
                    Precisão digital e previsibilidade
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Dados em tempo real para decisões assertivas, eliminando erros comuns em grandes cronogramas.
                  </p>
                </div>
              </div>

              <div
                className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col min-h-[300px]"
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <IconBolt className="text-5xl text-[#333333] dark:text-white mb-6" />
                <div className="flex-1 flex flex-col">
                  <h3 className="text-2xl font-extrabold mb-3">
                    Gestão ágil e monitorada
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Interface intuitiva e colaborativa para otimizar cronogramas e recursos. Com clareza total em todas as etapas, todos trabalham em sincronia. Bem-vindo à nova dinâmica da construção.
                  </p>
                </div>
              </div>
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

        {/* CTA Final */}
        <section className="relative py-32 px-6 bg-[#333333] text-white overflow-hidden">
          <div className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] leading-[0.95] mb-6">
              Pronto para o próximo nível?
            </h2>
            <p className="text-xl opacity-80 max-w-[600px] mx-auto mb-12 font-light">
              Organize suas obras com mais controle, clareza e previsibilidade em um só lugar.
            </p>
            <div className="flex justify-center">
              <Link
                href="/xgestao-inteligente"
                prefetch={false}
                className="bg-white text-[#333333] font-bold h-14 px-10 rounded-full hover:scale-105 transition-transform inline-flex items-center justify-center"
                data-testid="link-cta-acesso"
              >
                Acessar xgestão inteligente
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
