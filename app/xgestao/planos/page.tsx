'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RiCheckLine, RiErrorWarningLine, RiPriceTag3Line, RiVipCrownLine } from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { Badge } from '@shared/components/ui/badge';
import { useToast } from '@shared/hooks/use-toast';
import {
  useCheckout,
  usePerfilPlano,
  usePlanos,
  type CheckoutError,
  type PlanoApi,
} from '@features/planos/ui/use-planos';
import type { PlanoTier } from '@shared/lib/plans-catalog';

const ORDER: PlanoTier[] = ['free', 'pro', 'enterprise'];

function money(value: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function PlanCard({
  plano,
  currentTier,
  onChoose,
  pending,
  canChoosePaid,
}: {
  plano: PlanoApi;
  currentTier: PlanoTier;
  onChoose: (plano: PlanoApi) => void;
  pending: boolean;
  canChoosePaid: boolean;
}) {
  const isCurrent = plano.tier === currentTier;
  const isFree = plano.tier === 'free';
  const isFeatured = plano.tier === 'pro';
  const blockedByDocument = !isFree && !canChoosePaid;

  return (
    <article
      className={[
        'relative flex flex-col rounded-2xl border p-6 shadow-sm',
        isFeatured ? 'border-primary bg-primary text-primary-foreground shadow-lg' : 'border-border bg-card',
      ].join(' ')}
      data-testid={`xgestao-plano-${plano.tier}`}
    >
      {isFeatured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 hover:bg-amber-400">
          Mais escolhido
        </Badge>
      )}
      <div className="mb-6">
        <p className={isFeatured ? 'text-primary-foreground/80 text-sm font-semibold' : 'text-muted-foreground text-sm font-semibold'}>
          xgestão
        </p>
        <h2 className="mt-1 text-2xl font-bold">{plano.nome}</h2>
        <div className="mt-4 flex items-baseline gap-1">
          {isFree ? (
            <span className="text-3xl font-extrabold">Grátis</span>
          ) : (
            <>
              <span className="text-3xl font-extrabold">{money(plano.valorMensal)}</span>
              <span className={isFeatured ? 'text-primary-foreground/75 text-sm' : 'text-muted-foreground text-sm'}>/mês</span>
            </>
          )}
        </div>
      </div>

      <ul className="mb-7 flex flex-1 flex-col gap-3">
        {plano.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <RiCheckLine className="mt-0.5 size-4 shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant={isFeatured ? 'secondary' : 'outline'}
        className={isFeatured ? 'text-primary' : ''}
        disabled={isCurrent || pending || blockedByDocument}
        onClick={() => onChoose(plano)}
        data-testid={`xgestao-assinar-${plano.tier}`}
      >
        {isCurrent
          ? 'Plano atual'
          : pending
            ? 'Processando…'
            : blockedByDocument
              ? 'Informe o CNPJ'
              : isFree
                ? 'Começar grátis'
                : 'Escolher plano'}
      </Button>
    </article>
  );
}

export default function XGestaoPlanosPage() {
  const router = useRouter();
  const { data: planos, isLoading: loadingPlanos } = usePlanos('xgestao');
  const { data: perfil, isLoading: loadingPerfil } = usePerfilPlano('xgestao');
  const checkout = useCheckout('xgestao');
  const { toast } = useToast();
  const [activeRequest, setActiveRequest] = useState<string | null>(null);
  const currentTier = perfil?.plano ?? 'free';

  function choosePlan(plano: PlanoApi) {
    if (checkout.isPending || plano.tier === currentTier) return;
    if (plano.tier !== 'free' && perfil?.hasCpfCnpj !== true) {
      toast({
        title: 'CNPJ necessário',
        description: 'Complete os dados da empresa antes de assinar um plano pago.',
        variant: 'destructive',
      });
      router.push('/xgestao/configuracoes?tab=empresa');
      return;
    }
    setActiveRequest(plano.id);
    checkout.mutate(
      { planoId: plano.id, ciclo: 'mensal' },
      {
        onSuccess: () => {
          toast({ title: 'Plano atualizado', description: `${plano.nome} está ativo para sua conta xgestão.` });
        },
        onError: (error: CheckoutError) => {
          if (error.code === 'SESSION_EXPIRED') {
            window.location.assign(
              `/login?perfil=xgestao&next=${encodeURIComponent('/xgestao/planos')}&reason=session_expired`,
            );
            return;
          }
          if (error.code === 'PERFIL_INCOMPLETO') {
            toast({
              title: 'CNPJ necessário',
              description: 'Complete os dados da empreiteira em Configurações antes de assinar.',
              variant: 'destructive',
            });
            router.push('/xgestao/configuracoes?tab=empresa');
            return;
          }
          toast({
            title: 'Não foi possível iniciar o pagamento',
            description: error.message || 'Tente novamente em instantes.',
            variant: 'destructive',
          });
        },
        onSettled: () => setActiveRequest(null),
      },
    );
  }

  return (
    <main className="min-h-full bg-gradient-to-b from-muted/50 to-background px-4 py-10 md:py-14">
      <div className="mx-auto max-w-6xl">
        <header className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <RiPriceTag3Line className="size-4" />
            Planos xgestão
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Gestão de obras no ritmo da sua empresa</h1>
          <p className="mt-3 text-muted-foreground">
            Escolha quantas obras próprias sua equipe precisa acompanhar ao mesmo tempo.
          </p>
        </header>

        {perfil && (
          <section className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 p-5" data-testid="xgestao-uso-plano">
            <div className="flex items-start gap-3">
              <RiVipCrownLine className="mt-0.5 size-5 text-primary" />
              <div className="min-w-0">
                <p className="font-semibold">Seu plano atual: {perfil.catalogo.nome}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {perfil.uso.map((item) => (
                    <Badge key={item.key} variant="secondary">
                      {item.label}: {item.current} de {item.max}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {perfil && !perfil.hasCpfCnpj && (
          <section className="mb-8 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <RiErrorWarningLine className="mt-0.5 size-5 shrink-0" />
            <p>
              Informe o CNPJ da sua empreiteira em{' '}
              <Link href="/xgestao/configuracoes?tab=empresa" className="font-semibold underline underline-offset-2">
                Configurações
              </Link>{' '}
              para assinar um plano pago.
            </p>
          </section>
        )}

        {loadingPlanos || loadingPerfil ? (
          <div className="py-16 text-center text-muted-foreground">Carregando planos…</div>
        ) : (
          <section className="grid gap-6 md:grid-cols-3">
            {ORDER.map((tier) => {
              const plano = planos?.find((item) => item.tier === tier);
              return plano ? (
                <PlanCard
                  key={plano.id}
                  plano={plano}
                  currentTier={currentTier}
                  onChoose={choosePlan}
                  pending={checkout.isPending && activeRequest === plano.id}
                  canChoosePaid={perfil?.hasCpfCnpj === true}
                />
              ) : null;
            })}
          </section>
        )}
      </div>
    </main>
  );
}