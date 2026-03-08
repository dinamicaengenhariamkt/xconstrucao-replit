'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@features/auth/hooks/use-auth';
import { IconHome, IconConstruction } from '@shared/components/icons';

export default function NotFound() {
  const { user, isLoading } = useAuth();

  const dashboardUrl =
    user?.role === 'empreiteiro' ? '/empreiteiro/dashboard' :
    user?.role === 'contratante' ? '/contratante/dashboard' :
    user?.role === 'admin'       ? '/admin/financeiro'      : '/';

  const buttonLabel =
    user?.role === 'admin' ? 'Ir para o admin' :
    user             ? 'Ir para meu painel' : 'Voltar ao início';

  const subMessage = user
    ? 'Mas não se preocupe — seu painel está pronto para você.'
    : 'Mas não se preocupe — a home está intacta.';

  return (
    <div className="min-h-screen bg-white dark:bg-[#1C1F22] flex flex-col items-center justify-center px-6 text-center transition-colors duration-300">
      {/* Logo */}
      <Image
        src="/images/logo-xconstrucao-horizontal-01.png"
        alt="XConstrução"
        width={180}
        height={40}
        className="h-9 w-auto mb-12 opacity-80 dark:invert"
        priority
      />

      {/* Ícone decorativo */}
      <div className="w-20 h-20 rounded-2xl bg-[#333333]/5 dark:bg-white/5 flex items-center justify-center mb-6">
        <IconConstruction className="text-[#333333] dark:text-white/60 text-4xl" />
      </div>

      {/* Número 404 — elemento decorativo de fundo */}
      <div
        className="text-[140px] md:text-[180px] font-extrabold tracking-tighter leading-none select-none mb-[-20px]"
        style={{ color: 'transparent', WebkitTextStroke: '2px rgba(51,51,51,0.08)' }}
        aria-hidden="true"
      >
        404
      </div>

      {/* Título */}
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#101819] dark:text-white mb-3 mt-4">
        Essa página está em obras.
      </h1>

      {/* Subtexto */}
      <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-sm mb-10 leading-relaxed">
        {isLoading
          ? 'Verificando sua conta...'
          : subMessage}
      </p>

      {/* Ações */}
      {isLoading ? (
        <div className="h-14 w-48 rounded-full bg-[#333333]/10 dark:bg-white/10 animate-pulse" />
      ) : (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <Link
            href={dashboardUrl}
            className="inline-flex items-center gap-2 bg-[#333333] dark:bg-white text-white dark:text-[#1C1F22] font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all"
          >
            <IconHome className="text-xl" />
            {buttonLabel}
          </Link>

          {user && (
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors underline-offset-4 hover:underline"
            >
              Trocar de conta
            </Link>
          )}
        </div>
      )}

      {/* Rodapé discreto */}
      <p className="mt-16 text-xs text-slate-300 dark:text-slate-600">
        XConstrução · erro 404
      </p>
    </div>
  );
}
