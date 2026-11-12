"use client";

import { useRef } from "react";
import Link from "next/link";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { SiteTemaRaiz } from "@features/landing/components/SiteTemaRaiz";
import { SiteHeroPagina } from "@features/landing/components/SiteHeroPagina";
import { Reveal } from "@features/landing/components/Reveal";
import { RiShieldLine, RiMailLine, RiArrowRightLine } from 'react-icons/ri';
import { StructuredData } from "@features/landing/components/StructuredData";
import { generateBreadcrumbSchema, generateWebPageSchema } from '@features/landing/seo/seo-utils';
import { LegalDocumentView } from "@features/legal/components/LegalDocumentView";
import { IndiceDocumento } from "@features/legal/components/IndiceDocumento";

const FOCO = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40";

/**
 * Tipografia do documento legal ajustada pelo invólucro: o `LegalDocumentView`
 * também é usado num modal do marketplace e não muda. Os h2 levam scroll-mt-28
 * para o índice "Nesta página" não deixar o título sob o menu fixo.
 */
const LEITURA =
  "break-words [&_h1]:text-2xl md:[&_h1]:text-3xl [&_h1]:tracking-tight [&_h2]:mt-10 [&_h2]:scroll-mt-28 [&_h2]:text-xl md:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h3]:mt-8 [&_p]:leading-relaxed [&_p]:text-slate-600 dark:[&_p]:text-slate-300 [&_li]:leading-relaxed [&_strong]:text-[#101819] dark:[&_strong]:text-white";

export default function PoliticaDePrivacidade() {
  const documentoRef = useRef<HTMLElement>(null);

  return (
    <SiteTemaRaiz>
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300">
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Política de Privacidade', url: '/politica-privacidade' }
        ]),
        generateWebPageSchema({
          title: 'Política de Privacidade - XConstrução',
          description: 'Política de privacidade e proteção de dados da XConstrução',
          url: '/politica-privacidade',
          datePublished: '2026-01-01',
        })
      ]} />
      <GlassNav />

      {/* overflow-x-clip (e não overflow-hidden) para o índice sticky funcionar */}
      <main className="relative overflow-x-clip">
        <SiteHeroPagina
          migalhas={[{ nome: 'Política de Privacidade' }]}
          titulo="Política de Privacidade"
          icone={
            <span className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#333333] shadow-sm ring-1 ring-black/5 sm:inline-flex dark:bg-[#2A2D30] dark:text-white dark:ring-white/10">
              <RiShieldLine className="size-6" aria-hidden="true" />
            </span>
          }
        />

        {/* Content Section: versão vigente vinda do banco (legal_documents) */}
        <section className="px-6 pb-24 md:pb-32">
          <div className="mx-auto max-w-[900px] lg:grid lg:max-w-[1160px] lg:grid-cols-[220px_1fr] lg:gap-10">
            <aside className="hidden lg:block">
              <IndiceDocumento alvo={documentoRef} variante="lateral" />
            </aside>

            <div className="min-w-0">
              <IndiceDocumento alvo={documentoRef} variante="recolhido" className="mb-6 lg:hidden" />

              <Reveal y={16}>
                <article
                  ref={documentoRef}
                  className={`min-w-0 rounded-3xl border border-black/5 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.15)] sm:p-8 md:p-12 dark:border-white/10 dark:bg-[#22262A] ${LEITURA}`}
                >
                  <LegalDocumentView tipo="privacidade" mostrarVersao={false} />
                </article>
              </Reveal>

              {/* Important Notice Card */}
              <Reveal delay={0.08}>
                <div className="group relative mt-12 rounded-3xl border border-black/[0.04] bg-[#F4F5F5] p-6 sm:p-8 transition-all duration-300 hover:border-black/10 hover:bg-white hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.18)] dark:border-white/5 dark:bg-[#2A2D30] dark:hover:border-white/15 dark:hover:bg-[#30343A]">
                  <div className="flex flex-col items-start gap-6 sm:flex-row">
                    <div className="inline-flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#333333] shadow-sm ring-1 ring-black/5 transition-transform duration-300 group-hover:scale-105 dark:bg-[#1C1F22] dark:text-white dark:ring-white/10">
                      <RiMailLine className="text-2xl" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold mb-2">Dúvidas sobre Privacidade?</h3>
                      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                        Em caso de dúvidas sobre esta política ou sobre como tratamos seus dados, entre em contato com nosso Encarregado de Dados através do email:{" "}
                        <a href="mailto:privacidade@xconstrucao.com.br" className={`break-all rounded font-bold text-[#333333] dark:text-white underline ${FOCO}`}>
                          privacidade@xconstrucao.com.br
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-16">
                <Link
                  href="/cadastro"
                  className={`w-full sm:w-auto bg-[#333333] text-white dark:bg-white dark:text-[#1C1F22] font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center text-sm ${FOCO}`}
                >
                  Voltar para Cadastro
                </Link>
                <Link
                  href="/termos"
                  className={`group w-full sm:w-auto bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white font-bold px-8 py-3 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center gap-2 text-center text-sm ${FOCO}`}
                >
                  Ver Termos de Uso
                  <RiArrowRightLine className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
    </SiteTemaRaiz>
  );
}
