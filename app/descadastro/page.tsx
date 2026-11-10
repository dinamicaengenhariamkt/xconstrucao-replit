'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { GlassNav } from '@features/landing/components/GlassNav';
import { SiteFooter } from '@features/landing/components/SiteFooter';

/**
 * XG52 — descadastro do e-mail de dicas e novidades do xgestão, sem login.
 * A saída só acontece no clique (POST): pré-visualização do link pelo
 * provedor de e-mail não tira ninguém da lista.
 */
export default function DescadastroPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-[#101819] dark:bg-[#1C1F22] dark:text-white">
      <GlassNav showAccessButton={false} />
      <main className="flex flex-1 items-center justify-center px-6 pb-16 pt-32">
        <Suspense fallback={null}>
          <Descadastro />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
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
    <Card className="w-full max-w-md" data-testid="descadastro-card">
      <CardHeader>
        <CardTitle>E-mails do xgestão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
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
            <Button onClick={sair} disabled={estado === 'enviando'} data-testid="descadastro-confirmar">
              {estado === 'enviando' ? 'Saindo...' : 'Sim, não quero mais receber'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
