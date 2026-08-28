'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { RiCheckLine, RiErrorWarningLine, RiVipCrownLine } from 'react-icons/ri';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
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
        'relative flex min-w-0 flex-col rounded-2xl border p-5 shadow-sm',
        isFeatured ? 'border-primary bg-primary text-primary-foreground shadow-md' : 'border-border bg-card',
      ].join(' ')}
      data-testid={`xgestao-plano-${plano.tier}`}
    >
      {isFeatured && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 hover:bg-amber-400">
          Mais escolhido
        </Badge>
      )}
      <div className="mb-5">
        <p className={isFeatured ? 'text-xs font-semibold text-primary-foreground/80' : 'text-xs font-semibold text-muted-foreground'}>
          xgestão
        </p>
        <h3 className="mt-1 text-xl font-bold">{plano.nome}</h3>
        <div className="mt-3 flex items-baseline gap-1">
          {isFree ? (
            <span className="text-2xl font-extrabold">Grátis</span>
          ) : (
            <>
              <span className="text-2xl font-extrabold">{money(plano.valorMensal)}</span>
              <span className={isFeatured ? 'text-xs text-primary-foreground/75' : 'text-xs text-muted-foreground'}>/mês</span>
            </>
          )}
        </div>
      </div>

      <ul className="mb-6 flex flex-1 flex-col gap-2.5">
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
                ? 'Mudar para grátis'
                : 'Escolher plano'}
      </Button>
    </article>
  );
}

export function XGestaoPlanosSection() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: planos, isLoading: loadingPlanos, isError: planosError } = usePlanos('xgestao');
  const { data: perfil, isLoading: loadingPerfil, isError: perfilError } = usePerfilPlano('xgestao');
  const checkout = useCheckout('xgestao');
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
              `/login?perfil=xgestao&next=${encodeURIComponent('/xgestao/configuracoes?tab=plano')}&reason=session_expired`,
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

  if (loadingPlanos || loadingPerfil) {
    return (
      <Card data-testid="xgestao-planos-loading">
        <CardHeader><Skeleton className="h-7 w-44" /></CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-3">
          {[0, 1, 2].map((item) => <Skeleton key={item} className="h-80 rounded-2xl" />)}
        </CardContent>
      </Card>
    );
  }

  if (planosError || perfilError || !perfil) {
    return (
      <Card data-testid="xgestao-planos-error">
        <CardHeader><CardTitle>Plano e uso</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Não foi possível carregar os planos agora. Tente novamente em instantes.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="xgestao-planos-section">
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-primary/5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle>Plano e uso</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Acompanhe seus limites e escolha o plano ideal para sua operação.</p>
            </div>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <RiVipCrownLine className="size-4" />
              {perfil.catalogo.nome}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {perfil.uso.map((item) => (
              <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-xl font-bold">
                  {item.current}{' '}
                  <span className="text-sm font-normal text-muted-foreground">de {item.max >= 9999 ? 'ilimitado' : item.max}</span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {!perfil.hasCpfCnpj && (
        <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <RiErrorWarningLine className="mt-0.5 size-5 shrink-0" />
          <p>
            Informe o CNPJ da sua empreiteira em{' '}
            <Link href="/xgestao/configuracoes?tab=empresa" className="font-semibold underline underline-offset-2">
              Minha Empresa
            </Link>{' '}
            para assinar um plano pago.
          </p>
        </div>
      )}

      <section>
        <div className="mb-6">
          <h2 className="text-xl font-bold">Compare os planos</h2>
          <p className="mt-1 text-sm text-muted-foreground">Você pode alterar seu plano a qualquer momento.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {ORDER.map((tier) => {
            const plano = planos?.find((item) => item.tier === tier);
            return plano ? (
              <PlanCard
                key={plano.id}
                plano={plano}
                currentTier={currentTier}
                onChoose={choosePlan}
                pending={checkout.isPending && activeRequest === plano.id}
                canChoosePaid={perfil.hasCpfCnpj}
              />
            ) : null;
          })}
        </div>
      </section>
    </div>
  );
}