"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { IconShield, IconDashboardCustomize, IconTarget, IconHub, IconBolt } from '@shared/components/icons';
import { StructuredData } from "@features/landing/components/StructuredData";
import { generateBreadcrumbSchema, generateWebPageSchema } from '@features/landing/seo/seo-utils';
import { MarketplaceNotificacaoModal } from "@features/landing/components/MarketplaceNotificacaoModal";
import { AdSidebarSlot } from "@features/shared/anuncios/components/AdSidebarSlot";

export default function HomePage() {
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);

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
              <a
                href="#solucoes"
                className="bg-[#7C3AED] text-white font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all inline-flex flex-col items-center justify-center leading-tight"
                data-testid="link-marketplace-em-breve"
              >
                <span>marketplace</span>
                <span className="text-xs font-medium opacity-80">(em breve)</span>
              </a>
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

        {/* Parceiros / Trust Bar */}
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
                className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col min-h-[360px]"
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
                    Sistema completo de gestão de obras com dashboards financeiros,
                    progresso real-time, alertas, relatórios e SINAPI integrado.
                    Controle total, transparência e previsibilidade desde o primeiro dia.
                  </p>
                  <p className="text-slate-700 dark:text-slate-200 text-sm font-bold mb-8">
                    Teste Grátis por 3 meses
                  </p>
                  <div className="mt-auto">
                    <Link
                      href="/acesso-plataforma"
                      prefetch={false}
                      className="bg-[#333333] text-white font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all inline-flex items-center text-sm"
                      data-testid="link-comecar-xgestao"
                    >
                      Começar com xgestão inteligente
                    </Link>
                  </div>
                </div>
              </div>

              {/* Card Marketplace xconstrução (em breve) */}
              <div
                className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col min-h-[360px]"
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <IconHub className="text-5xl text-[#7C3AED] mb-6" />
                <div className="flex-1 flex flex-col">
                  <h3 className="text-xl md:text-2xl font-extrabold mb-1">
                    Marketplace xconstrução
                  </h3>
                  <p className="text-[#7C3AED] text-sm font-medium italic mb-5">
                    (em breve)
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed mb-4">
                    Conexão direta entre contratantes e empreiteiros qualificados,
                    com intermediação segura, escrow e oportunidades exclusivas.
                    Acesso a profissionais verificados com Responsabilidade Técnica
                    ativa (ART/RRT) e portfólio validado — qualidade, legalidade
                    e experiência comprovada em cada projeto.
                  </p>
                  <div className="mt-auto">
                    <button
                      type="button"
                      onClick={() => setMarketplaceModalOpen(true)}
                      className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold px-8 py-3 rounded-full transition-colors inline-flex items-center text-sm"
                      data-testid="button-notificar-marketplace"
                    >
                      Quero ser notificado quando lançar
                    </button>
                  </div>
                </div>
              </div>
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

        {/* Projetos em Destaque */}
        <section id="projetos" className="py-32 px-6 scroll-mt-24">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-20 gap-8">
              <div className="max-w-[600px]">
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                  Projetos em <br />
                  Destaque
                </h2>
                <p className="text-xl text-slate-500">
                  Conheça alguns dos projetos que transformamos em realidade.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Residência Aurora",
                  location: "Alphaville, SP",
                  imageUrl:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuA8DmbXHWnFRx9HxLakzPyNurJA72UzcVOvQQEBJqvLxnyCcZeKjX1aXtrBDlXVEaKi49al2DZGMd2ur1D_-Jzoszo_rG7WhvAcJU1jZHR1fY0XtuYvxQE6etY5f1_4bQ_nszNI7JNfvPJ-mPrD900yFW47Iwnr22abQx1dR3PCkmaldJj9XTbNZuL0gppYAHJwDGJ4O3-8TLdIXjtEKGTSIbUrlsrFYM-P0kjU2emLbko53Z4_5_fCNiUVrl2ShrZGxRJZBRMwDrL8",
                },
                {
                  title: "Edifício Horizonte",
                  location: "Itaim Bibi, SP",
                  imageUrl:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuB1BBXAC9cxWtr_xxq6GMheh1UPMH7QOxjVXSxQMxBDlikGJlY7tcI8lLgR1phw-5h0LupLOK0buFsedKQd_HhLx_ot54xJ74x-QU43v_Vv_PGsGWt3AjxViGN79yfdq8UcyPOgE51HrOIMiE0hca5CUMZVPgdT4rbFNrg2aNk3hgNC7EHMhLfE7v1VHieW_Jm5GbXhcbToyZnqG_Ywfot5vZzy0oD7UAfDmKZ3WPAb6EiDMEUdVQqtNHN8ChonOHFid74Qa5MZguOO",
                },
                {
                  title: "Loft Industrial",
                  location: "Lapa, RJ",
                  imageUrl:
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCEFDr73BPGE09f2fzelh2zX730l7a3m3Qpst4iN6IVL0ZpJa0b3tZO6dF5GFwLDt7GC5EpG4D9mW3iL0Eb3Wo9mOIzpI5nNqIpHHDZU0M5M6AM6uk4zZeXIXVRUMSx-QPgfNoDIn9JX3pOd5lmdHtrTDNWyGdKWfa0_KRgDwFMAnPxgwg4l1YH55RALHwoMCnmhBJwnWaX6KRWnldYsBM4rQrLu0etItQtd7amvmvoxq83hLsupAAqxZuUe0SpI_J7z6TBSbqwM7wj",
                },
              ].map((project) => (
                <div key={project.title} className="flex flex-col gap-4">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer grayscale hover:grayscale-0"
                    style={{
                      backgroundImage: `url("${project.imageUrl}")`,
                    }}
                  ></div>
                  <div className="flex justify-between items-center px-1">
                    <span className="font-bold">{project.title}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {project.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mercado em Foco */}
        <section className="py-32 px-6 bg-[#fcfcfc] dark:bg-background-dark/50">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between md:items-end mb-20 gap-8">
              <div className="max-w-[600px]">
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                  Mercado em <br />
                  Foco
                </h2>
                <p className="text-xl text-slate-500">
                  Informações e conteúdos selecionados para profissionais da
                  construção.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Card 1: Conteúdo de Marca (Advertorial) */}
              <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg">
                <div className="relative">
                  <div
                    className="aspect-video bg-cover bg-center"
                    style={{
                      backgroundImage:
                        'url("https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600")',
                    }}
                  ></div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                      Conteúdo de Marca
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mb-2">
                    Por{" "}
                    <span className="font-semibold text-slate-700">
                      Anunciante
                    </span>
                  </p>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                    Inovações em construção modular aceleram entregas de
                    projetos
                  </h3>
                </div>
              </div>

              {/* Card 2: Widget de Cotações (Valor/Mia) */}
              <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-600 font-bold text-sm">
                      valor data
                    </span>
                    <span className="text-purple-600 font-bold text-xl">
                      mia
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">oferecido por</p>
                    <span className="text-purple-600 font-bold text-xl">
                      nu
                    </span>
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-slate-500 text-sm">Ibovespa</p>
                  <p className="text-slate-400 text-xs">
                    179.847pts (+4257,19)
                  </p>
                  <p className="text-green-500 text-2xl font-bold flex items-center gap-1">
                    <span>▲</span> 2.43%
                  </p>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-2">
                    <span>MOEDAS</span>
                    <span>COMPRA</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">
                      Dólar Comercial
                    </span>
                    <span className="text-orange-500 font-semibold">
                      R$ 5,287
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-700 dark:text-slate-300">
                      Euro Comercial
                    </span>
                    <span className="text-orange-500 font-semibold">
                      R$ 6,245
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs text-slate-400">
                    atualizado 23/01/2026 18h00
                  </p>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">fonte:</p>
                    <span className="text-red-600 font-bold text-sm">
                      Valor<sup className="text-xs">PRO</sup>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Slot de anúncio público (J16) — invisível enquanto não há campanha ativa */}
        <div className="max-w-[420px] mx-auto px-6">
          <AdSidebarSlot zoneId="banner-qa" />
        </div>

        {/* CTA Final */}
        <section className="relative py-32 px-6 bg-[#333333] text-white overflow-hidden">
          <div className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] leading-[0.95] mb-6">
              Pronto para o próximo nível?
            </h2>
            <p className="text-xl opacity-80 max-w-[600px] mx-auto mb-12 font-light">
              Comece agora com a xgestão inteligente (3 meses grátis) e prepare-se para o marketplace completo.
            </p>
            <div className="flex justify-center">
              <Link
                href="/acesso-plataforma"
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

      <MarketplaceNotificacaoModal
        open={marketplaceModalOpen}
        onOpenChange={setMarketplaceModalOpen}
      />
    </div>
  );
}
