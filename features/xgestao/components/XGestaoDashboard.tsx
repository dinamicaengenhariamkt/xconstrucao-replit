'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  RiBuilding2Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiLineChartLine,
  RiMoneyDollarCircleLine,
  RiToolsLine,
} from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { StatsCard } from '@features/shared/components/StatsCard';
import { useMinhasObras } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import { NovaObraModal } from './NovaObraModal';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Button } from '@shared/components/ui/button';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

export function XGestaoDashboard() {
  const { data: obras, isLoading, isError } = useMinhasObras();
  const obrasProprias = useMemo(() => (obras ?? []).filter((obra) => obra.isObraPropria), [obras]);

  const resumo = useMemo(() => {
    const concluidas = obrasProprias.filter((obra) => obra.status === 'finalizada').length;
    const ativas = obrasProprias.length - concluidas;
    const orcamento = obrasProprias.reduce((total, obra) => total + obra.orcamento, 0);
    const progresso = obrasProprias.length
      ? Math.round(obrasProprias.reduce((total, obra) => total + obra.progresso, 0) / obrasProprias.length)
      : 0;
    // XG17 — a contagem por status de saúde saiu junto com o `HealthSummary`.
    return { ativas, concluidas, orcamento, progresso };
  }, [obrasProprias]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-10">
        <Skeleton className="h-20 w-full max-w-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-36 rounded-xl" />)}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <RiErrorWarningLine className="size-10 text-destructive" />
            <h1 className="text-xl font-bold">Não foi possível carregar o dashboard</h1>
            <p className="text-sm text-muted-foreground">Atualize a página para tentar novamente.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (obrasProprias.length === 0) {
    return (
      <div className="space-y-8 p-6 md:p-10">
        <PageHeader
          title="Painel de Visão Geral"
          subtitle="Acompanhe os principais indicadores das suas próprias obras."
        />
        <Card className="luminous-section border-transparent shadow-none">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
              <RiBuilding2Line className="size-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Comece pela sua primeira obra</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Assim que uma obra própria for cadastrada, os indicadores de execução aparecerão aqui automaticamente.
            </p>
            <div className="mt-6"><NovaObraModal /></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 md:p-10" data-testid="xgestao-dashboard-page">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Painel de Visão Geral"
          subtitle="Acompanhe os principais indicadores das suas próprias obras."
        />
        <NovaObraModal />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* XG13 — `luminous` já existia no `StatsCard` e só não era passado aqui:
            o painel do xgestão renderizava card liso enquanto o dashboard do
            empreiteiro tinha o acabamento completo. Prop opt-in, nenhum arquivo
            compartilhado alterado. */}
        <StatsCard luminous label="Obras ativas" value={resumo.ativas} icon={RiToolsLine} iconBgColor="bg-primary/10 text-primary" />
        <StatsCard luminous label="Obras concluídas" value={resumo.concluidas} icon={RiCheckboxCircleLine} iconBgColor="bg-success/10 text-success" />
        <StatsCard luminous label="Progresso médio" value={`${resumo.progresso}%`} icon={RiLineChartLine} iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20" />
        <StatsCard luminous label="Orçamento gerenciado" value={formatCurrency(resumo.orcamento)} icon={RiMoneyDollarCircleLine} iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20" />
      </div>

      {/* XG17 — o resumo de Saúde saiu do dashboard do xgestão junto com o card
          e a aba do console: mesma razão, mesma reversão. Ele linkava para
          `/xgestao/obras?saude=…`, filtro que também foi retirado da lista. O
          `HealthSummary` segue servindo o dashboard do marketplace. */}

      <Card className="luminous-section border-transparent shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Obras recentes</CardTitle>
          <Button asChild variant="ghost" size="sm"><Link href="/xgestao/obras">Ver todas</Link></Button>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          {obrasProprias.slice(0, 5).map((obra) => (
            /* XG13 — mesmo realce de item clicável do dashboard do empreiteiro
               (`ActivityItem`): barra primary que cresce à esquerda no hover. */
            <Link
              key={obra.id}
              href={`/xgestao/obras/${obra.id}`}
              className="group relative flex items-center justify-between gap-4 rounded-lg px-2 py-4 transition-colors hover:bg-primary/[0.04] hover:text-primary dark:hover:bg-primary/[0.08]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-1/2 h-0 w-[2px] -translate-y-1/2 rounded-r bg-primary opacity-0 transition-all duration-300 group-hover:h-[60%] group-hover:opacity-100"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{obra.titulo}</p>
                <p className="truncate text-xs text-muted-foreground">{obra.endereco}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold">{obra.progresso}%</p>
                <p className="text-[11px] text-muted-foreground">executado</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}