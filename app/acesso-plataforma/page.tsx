"use client";

import Link from "next/link";
import { GlassNav } from "@features/landing/components/GlassNav";
import { SiteFooter } from "@features/landing/components/SiteFooter";
import { IconBusiness, IconConstruction } from "@shared/components/icons";

export default function AcessoPlataformaPage() {
  return (
    <div className="bg-white dark:bg-[#1C1F22] font-sans text-[#101819] dark:text-white transition-colors duration-300 min-h-screen flex flex-col">
      <GlassNav showAccessButton={false} showAdminButton={true} />

      <main className="relative pt-32 flex-1">
        <section className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="max-w-[900px] w-full">
            <h1
              className="text-4xl md:text-6xl font-extrabold tracking-[-0.04em] leading-[0.95] mb-6"
              data-testid="text-acesso-title"
            >
              Acesso à{" "}
              <span className="text-[#333333] dark:text-white">
                plataforma xconstrução
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 font-medium max-w-[600px] mx-auto leading-relaxed mb-16">
              Escolha como deseja acessar a plataforma xconstrução
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[800px] mx-auto">
              <div
                className="bg-white dark:bg-slate-900/50 rounded-3xl p-12 border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col items-center text-center"
                data-testid="card-contratante"
              >
                <IconBusiness className="text-6xl text-[#333333] dark:text-white mb-6" />
                <h3 className="text-2xl font-bold mb-3">Contratante</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                  Gerencie suas obras, acompanhe o progresso e controle
                  pagamentos.
                </p>
                <Link
                  href="/login?perfil=contratante"
                  className="w-full bg-[#333333] text-white font-bold py-4 rounded-full hover:scale-105 transition-transform text-sm leading-tight inline-flex items-center justify-center"
                  data-testid="link-login-contratante"
                >
                  Acessar
                </Link>
              </div>

              <div
                className="bg-white dark:bg-slate-900/50 rounded-3xl p-12 border border-slate-100 dark:border-slate-800 hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-300 flex flex-col items-center text-center"
                data-testid="card-empreiteiro"
              >
                <IconConstruction className="text-6xl text-[#333333] dark:text-white mb-6" />
                <h3 className="text-2xl font-bold mb-3">Empreiteiro</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
                  Encontre novas oportunidades, gerencie projetos e envie
                  propostas.
                </p>
                <Link
                  href="/login?perfil=empreiteiro"
                  className="w-full bg-[#333333] text-white font-bold py-4 rounded-full hover:scale-105 transition-transform text-sm leading-tight inline-flex items-center justify-center"
                  data-testid="link-login-empreiteiro"
                >
                  Acessar
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
