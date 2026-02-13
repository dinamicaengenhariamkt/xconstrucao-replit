"use client";

import Link from "next/link";
import Image from "next/image";
import { GlassNav } from "@/components/glass-nav";
import { SiteFooter } from "@/components/site-footer";

export default function HomePage() {
  return (
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300">
      <GlassNav />

      <main className="relative pt-32 overflow-hidden">
        {/* Hero Section */}
        <section
          id="inicio"
          className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center"
        >
          <div className="max-w-[1000px] w-full">
            <Image
              src="/images/logo-xconstrucao-vertical.png"
              alt="XConstrução"
              width={96}
              height={96}
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
                href="/acesso-plataforma"
                className="bg-[#333333] text-white font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center"
                data-testid="link-sou-empreiteiro"
              >
                Sou Empreiteiro
              </Link>
              <Link
                href="/acesso-plataforma"
                className="bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white font-bold h-14 px-10 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center"
                data-testid="link-sou-contratante"
              >
                Sou Contratante
              </Link>
            </div>
          </div>
        </section>

        {/* Parceiros / Trust Bar */}
        <section className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-10">
              Nossos Parceiros
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-40">
              {["Parceiro 1", "Parceiro 2", "Parceiro 3", "Parceiro 4", "Parceiro 5"].map(
                (partner) => (
                  <div
                    key={partner}
                    className="text-sm font-bold text-slate-500 uppercase tracking-wider"
                  >
                    {partner}
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Bento Features - Inovação em cada etapa */}
        <section id="solucoes" className="py-20 px-6">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.03em] mb-16 text-center">
              Inovação em cada etapa
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-8 flex flex-col justify-between min-h-[220px]"
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <span className="material-symbols-outlined text-4xl text-[#333333] dark:text-white mb-4">
                  security
                </span>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Segurança e agilidade
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Processos protegidos e otimizados para garantir eficiência em
                    cada fase.
                  </p>
                </div>
              </div>

              <div
                className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-8 flex flex-col justify-between min-h-[220px]"
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <span className="material-symbols-outlined text-4xl text-[#333333] dark:text-white mb-4">
                  precision_manufacturing
                </span>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Precisão digital e previsibilidade
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Dados e métricas inteligentes para decisões assertivas em
                    todos os seus projetos.
                  </p>
                </div>
              </div>

              <div
                className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-8 flex flex-col justify-between min-h-[220px]"
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <span className="material-symbols-outlined text-4xl text-[#333333] dark:text-white mb-4">
                  hub
                </span>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Conexão xconstrução
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Rede exclusiva que conecta contratantes a empreiteiros
                    qualificados.
                  </p>
                </div>
              </div>

              <div
                className="bg-[#333333] text-white rounded-2xl p-8 flex flex-col justify-between min-h-[220px] md:col-span-2"
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <span className="material-symbols-outlined text-4xl mb-4">
                  verified
                </span>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Profissionais com Responsabilidade Técnica e portfólio
                    validado
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Todos os profissionais da plataforma são verificados e possuem
                    documentação técnica comprovada.
                  </p>
                </div>
              </div>

              <div
                className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-8 flex flex-col justify-between min-h-[220px]"
                style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
              >
                <span className="material-symbols-outlined text-4xl text-[#333333] dark:text-white mb-4">
                  monitoring
                </span>
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    Gestão ágil e monitorada
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Acompanhe cada detalhe com dashboards modernos e relatórios
                    em tempo real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Projetos em Destaque */}
        <section id="projetos" className="py-20 px-6 bg-[#F4F5F5] dark:bg-[#2A2D30]">
          <div className="max-w-[1200px] mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.03em] mb-4 text-center">
              Projetos em Destaque
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 text-center mb-16 max-w-[600px] mx-auto">
              Conheça alguns dos projetos que estão transformando o mercado da
              construção civil.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Residencial Alto Padrão",
                  category: "Residencial",
                  status: "Em andamento",
                },
                {
                  title: "Complexo Comercial Centro",
                  category: "Comercial",
                  status: "Concluído",
                },
                {
                  title: "Retrofit Industrial",
                  category: "Industrial",
                  status: "Em andamento",
                },
              ].map((project) => (
                <div
                  key={project.title}
                  className="bg-white dark:bg-[#1C1F22] rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800"
                  style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
                >
                  <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800" />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#333333] dark:text-white bg-[#F4F5F5] dark:bg-[#2A2D30] px-3 py-1 rounded-full">
                        {project.category}
                      </span>
                      <span className="text-xs font-medium text-[#22846D]">
                        {project.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">{project.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mercado em Foco */}
        <section className="py-20 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-extrabold tracking-[-0.03em] mb-6">
                  Mercado em Foco
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                  Acompanhe as principais tendências, índices e dados do
                  mercado da construção civil em tempo real. Fique sempre à
                  frente com informações atualizadas.
                </p>
                <div className="flex flex-wrap gap-6">
                  <div>
                    <p className="text-3xl font-extrabold text-[#333333] dark:text-white">
                      R$ 2.8T
                    </p>
                    <p className="text-sm text-slate-400">PIB Construção 2025</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-[#22846D]">
                      +12.4%
                    </p>
                    <p className="text-sm text-slate-400">Crescimento Anual</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-[#1E88E5]">
                      3.2M
                    </p>
                    <p className="text-sm text-slate-400">Empregos Gerados</p>
                  </div>
                </div>
              </div>
              <div className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-8">
                <h3 className="text-lg font-bold mb-6">Índices do Mercado</h3>
                <div className="space-y-4">
                  {[
                    { name: "INCC-M", value: "0.67%", trend: "up" },
                    { name: "CUB/m²", value: "R$ 1.892,45", trend: "up" },
                    { name: "SINAPI", value: "R$ 1.756,30", trend: "down" },
                    { name: "IPCA Habitação", value: "0.45%", trend: "up" },
                  ].map((index) => (
                    <div
                      key={index.name}
                      className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700 last:border-0"
                    >
                      <span className="font-medium text-sm">{index.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{index.value}</span>
                        <span
                          className={`material-symbols-outlined text-sm ${
                            index.trend === "up"
                              ? "text-[#22846D]"
                              : "text-[#E53935]"
                          }`}
                        >
                          {index.trend === "up"
                            ? "trending_up"
                            : "trending_down"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* xgestão inteligente + SINAPI */}
        <section className="py-20 px-6">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div
              className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col justify-between min-h-[300px]"
              style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
            >
              <span className="material-symbols-outlined text-5xl text-[#333333] dark:text-white mb-4">
                dashboard_customize
              </span>
              <div>
                <h3 className="text-2xl font-extrabold mb-3">
                  xgestão inteligente
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  Sistema completo de gestão com IA para otimizar custos, prazos
                  e recursos em suas obras.
                </p>
                <Link
                  href="/xgestao-inteligente"
                  className="bg-[#333333] text-white font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all inline-flex items-center text-sm"
                  data-testid="link-saiba-mais"
                >
                  Saiba Mais
                </Link>
              </div>
            </div>

            <div
              className="bg-[#F4F5F5] dark:bg-[#2A2D30] rounded-2xl p-10 flex flex-col justify-between min-h-[300px]"
              style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
            >
              <span className="material-symbols-outlined text-5xl text-[#333333] dark:text-white mb-4">
                calculate
              </span>
              <div>
                <h3 className="text-2xl font-extrabold mb-3">
                  Comece com xgestão inteligente
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  Teste gratuitamente por 3 meses e descubra o poder de uma
                  gestão transparente e eficiente.
                </p>
                <Link
                  href="/acesso-plataforma"
                  className="bg-[#333333] text-white font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all inline-flex items-center text-sm"
                >
                  Teste Grátis
                </Link>
              </div>
            </div>

            <div
              className="bg-[#333333] text-white rounded-2xl p-10 flex flex-col justify-center items-center text-center min-h-[160px] md:col-span-2"
              style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}
            >
              <span className="material-symbols-outlined text-4xl mb-3">
                table_chart
              </span>
              <h3 className="text-xl font-bold mb-2">
                SINAPI em Todos os Planos
              </h3>
              <p className="text-white/70 text-sm max-w-[500px]">
                Acesse a tabela SINAPI atualizada em todos os planos da
                plataforma, sem custos adicionais.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="relative py-32 px-6 bg-[#333333] text-white overflow-hidden">
          <div className="relative z-10 max-w-[800px] mx-auto text-center">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] leading-[0.95] mb-6">
              Pronto para o próximo nível?
            </h2>
            <p className="text-xl opacity-80 max-w-[600px] mx-auto mb-12 font-light">
              Junte-se à xconstrução.
              <br />A plataforma que está revolucionando a construção civil.
            </p>
            <div className="flex justify-center">
              <Link
                href="/acesso-plataforma"
                className="bg-white text-[#333333] font-bold h-14 px-10 rounded-full hover:scale-105 transition-transform inline-flex items-center justify-center"
                data-testid="link-cta-acesso"
              >
                Acesso à Plataforma
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
