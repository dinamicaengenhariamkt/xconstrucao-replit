'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { GlassNav } from '@features/landing/components/GlassNav';
import { SiteFooter } from '@features/landing/components/SiteFooter';
import { SiteTemaRaiz } from '@features/landing/components/SiteTemaRaiz';
import { SiteHeroPagina } from '@features/landing/components/SiteHeroPagina';
import { Reveal } from '@features/landing/components/Reveal';

/**
 * XG52 — descadastro do e-mail de dicas e novidades do xgestão, sem login.
 * A saída só acontece no clique (POST): pré-visualização do link pelo
 * provedor de e-mail não tira ninguém da lista.
 */
export default function DescadastroPage() {
  return (
    <SiteTemaRaiz>
    <div className="flex min-h-screen flex-col bg-white font-sans text-[#101819] dark:bg-[#1C1F22] dark:text-white">
      <GlassNav showAccessButton={false} />
      <SiteHeroPagina compacto migalhas={[{ nome: 'Descadastro' }]} />
      <main className="relative z-10 -mt-2 flex flex-1 justify-center px-4 pb-16 sm:px-6 sm:pb-24">
        <Reveal y={12} className="w-full max-w-md">
        <Suspense fallback={null}>
          <Descadastro />
        </Suspense>
        </Reveal>
      </main>
      <SiteFooter />
    </div>
    </SiteTemaRaiz>
  );
}

type Estado = 'inicial' | 'enviando' | 'feito' | 'erro';

function Descadastro() {
  const token = useSearchParams().get('t') ?? '';
  const [estado, setEstado] = useState<Estado>(token ? 'inicial' : 'erro');

  const sair = async () => {
    setEstado('enviando');
    try {
      const r = await fetch(`/api/xgestao/descadastro?t=${encodeURIComponent(token)}`, { method: 'POST' });
      setEstado(r.ok ? 'feito' : 'erro');
    } catch {
      setEstado('erro');
    }
  };

  return (
    <Card className="w-full max-w-md rounded-3xl border-black/5 bg-white text-[#101819] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-[#22262A] dark:text-white dark:shadow-none" data-testid="descadastro-card">
      <CardHeader className="p-6 pb-2 sm:px-10 sm:pt-10">
        <CardTitle className="text-2xl font-extrabold">E-mails do xgestão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-2 text-sm text-slate-500 sm:px-10 sm:pb-10 dark:text-slate-400">
        {estado === 'feito' && (
          <p data-testid="descadastro-confirmado">
            Pronto. Você não vai mais receber dicas e novidades do xgestão por e-mail. Os avisos sobre a sua conta,
            como cobrança e fim do teste, continuam chegando. Se mudar de ideia, é só ligar de novo em Configurações,
            na aba Notificações.
          </p>
        )}
        {estado === 'erro' && (
          <p data-testid="descadastro-erro">
            Não conseguimos confirmar este link. Você também pode desligar os e-mails em Configurações, na aba
            Notificações, depois de entrar na sua conta.
          </p>
        )}
        {(estado === 'inicial' || estado === 'enviando') && (
          <>
            <p>Quer parar de receber dicas e novidades do xgestão por e-mail?</p>
            <Button onClick={sair} disabled={estado === 'enviando'} className="min-h-12 w-full whitespace-normal rounded-full border-[#333333] bg-[#333333] px-6 py-3 font-bold text-white hover:bg-[#333333] hover:brightness-110 sm:w-auto dark:border-white dark:bg-white dark:text-[#1C1F22] dark:hover:bg-white dark:hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#333333]/40 dark:focus-visible:ring-white/40" data-testid="descadastro-confirmar">
              {estado === 'enviando' ? 'Saindo...' : 'Sim, não quero mais receber'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
