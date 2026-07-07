"use client";

import Link from "next/link";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { Card, CardContent } from "@shared/components/ui/card";
import { RiShieldLine, RiMailLine } from 'react-icons/ri';
import { StructuredData } from "@features/landing/components/StructuredData";
import { generateBreadcrumbSchema, generateWebPageSchema } from '@features/landing/seo/seo-utils';
import { LegalDocumentView } from "@features/legal/components/LegalDocumentView";

export default function PoliticaDePrivacidade() {
  return (
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

      <main className="relative overflow-hidden">
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center min-h-[60vh] px-6 pt-32 pb-20">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <div
              className="w-full h-full bg-cover bg-center opacity-[0.08]"
              style={{ backgroundImage: 'url("/images/background-homepage.png")' }}
            />
          </div>
          <div className="relative z-10 max-w-[900px] w-full flex flex-col items-center text-center gap-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#333333]/10 dark:bg-white/10 text-[#333333] dark:text-white text-sm font-bold uppercase tracking-wider">
              <RiShieldLine className="w-4 h-4" />
              <span>Política de Privacidade</span>
            </div>
            <h1
              className="text-5xl md:text-7xl font-extrabold tracking-[-0.04em] leading-[0.95]"
              style={{ textShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
            >
              Política de Privacidade
            </h1>
          </div>
        </section>

        {/* Content Section — J28: versão vigente vinda do banco (legal_documents) */}
        <section className="py-20 px-6">
          <div className="max-w-[900px] mx-auto">
            <LegalDocumentView tipo="privacidade" />

            {/* Important Notice Card */}
            <Card className="mt-12 bg-[#F4F5F5] dark:bg-[#2A2D30] border-0" style={{ boxShadow: "0 10px 40px -10px rgba(0,0,0,0.04)" }}>
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <RiMailLine className="w-8 h-8 text-[#333333] dark:text-white flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold mb-2">Dúvidas sobre Privacidade?</h3>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                      Em caso de dúvidas sobre esta política ou sobre como tratamos seus dados, entre em contato com nosso Encarregado de Dados através do email:{" "}
                      <a href="mailto:privacidade@xconstrucao.com.br" className="font-bold text-[#333333] dark:text-white underline">
                        privacidade@xconstrucao.com.br
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-16">
              <Link
                href="/cadastro"
                className="bg-[#333333] text-white font-bold px-8 py-3 rounded-full hover:brightness-110 transition-all inline-flex items-center justify-center text-sm"
              >
                Voltar para Cadastro
              </Link>
              <Link
                href="/termos"
                className="bg-white dark:bg-[#2A2D30] text-[#333333] dark:text-white font-bold px-8 py-3 rounded-full border-2 border-[#333333] dark:border-white/20 hover:brightness-95 transition-all inline-flex items-center justify-center text-sm"
              >
                Ver Termos de Uso
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
