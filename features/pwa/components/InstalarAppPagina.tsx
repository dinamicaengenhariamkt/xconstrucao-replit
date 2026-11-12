'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { XGESTAO_HOME } from '@features/xgestao/routes';
import { SiteTemaRaiz } from '@features/landing/components/SiteTemaRaiz';
import { SiteBreadcrumb } from '@features/landing/components/SiteHeroPagina';
import { Reveal } from '@features/landing/components/Reveal';
import { rodandoComoApp } from '../lib/use-instalar-app';
import { InstalarAppPassos } from './InstalarAppPassos';

/** /instalar — destino do QR code. Aberto já pelo app, segue direto para o painel. */
export function InstalarAppPagina() {
  const router = useRouter();

  useEffect(() => {
    if (rodandoComoApp()) router.replace(XGESTAO_HOME);
  }, [router]);

  return (
    <SiteTemaRaiz>
    <main className="flex min-h-screen flex-col items-center bg-white px-4 py-10 sm:px-6 font-sans text-[#101819] dark:bg-[#1C1F22] dark:text-white">
      <Link href="/" prefetch={false} aria-label="XConstrução, página inicial" className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40">
        <Image src="/images/logo-xconstrucao-vertical-01.png" alt="XConstrução" width={600} height={300} className="h-20 w-auto dark:invert" priority />
      </Link>
      <div className="mt-8 w-full max-w-[440px]">
        <SiteBreadcrumb itens={[{ nome: 'Instalar o app' }]} className="mb-5" />
        <h1 className="break-words text-3xl font-extrabold tracking-tight sm:text-4xl">Leve o xgestão no celular</h1>
        <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
          Instale em poucos segundos, sem loja e sem configurar nada. O ícone vai para a tela inicial e abre direto nas suas obras.
        </p>
        <Reveal y={12}>
        <div className="mt-8 rounded-3xl border border-black/5 bg-[#F4F5F5] p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)] sm:p-8 dark:border-white/10 dark:bg-[#22262A] dark:shadow-none">
          <InstalarAppPassos />
        </div>
        </Reveal>
        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          Prefere usar pelo navegador?{' '}
          <Link href={XGESTAO_HOME} prefetch={false} className="rounded font-semibold text-[#333333] underline underline-offset-2 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40" data-testid="link-instalar-usar-navegador">
            Acessar o xgestão
          </Link>
        </p>
      </div>
    </main>
    </SiteTemaRaiz>
  );
}
