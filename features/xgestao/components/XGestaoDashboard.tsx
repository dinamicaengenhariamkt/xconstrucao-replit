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
import { HealthSummary, useObrasHealthMap } from '@features/shared/health';
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
  const { data: healthMap } = useObrasHealthMap('empreiteiro');
  const obrasProprias = useMemo(() => (obras ?? []).filter((obra) => obra.isObraPropria), [obras]);

  const resumo = useMemo(() => {
    const concluidas = obrasProprias.filter((obra) => obra.status === 'finalizada').length;
    const ativas = obrasProprias.length - concluidas;
    const orcamento = obrasProprias.reduce((total, obra) => total + obra.orcamento, 0);
    const progresso = obrasProprias.length
      ? Math.round(obrasProprias.reduce((total, obra) => total + obra.progresso, 0) / obrasProprias.length)
      : 0;
    const health = { saudavel: 0, atencao: 0, risco: 0, total: obrasProprias.length };
    for (const obra of obrasProprias) {
      const status = healthMap?.[obra.id]?.status;
      if (status) health[status] += 1;
    }
    return { ativas, concluidas, orcamento, progresso, health };
  }, [healthMap, obrasProprias]);

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
        <Card className="border-gray-100 dark:border-gray-800">
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
        <StatsCard label="Obras ativas" value={resumo.ativas} icon={RiToolsLine} iconBgColor="bg-primary/10 text-primary" />
        <StatsCard label="Obras concluídas" value={resumo.concluidas} icon={RiCheckboxCircleLine} iconBgColor="bg-success/10 text-success" />
        <StatsCard label="Progresso médio" value={`${resumo.progresso}%`} icon={RiLineChartLine} iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20" />
        <StatsCard label="Orçamento gerenciado" value={formatCurrency(resumo.orcamento)} icon={RiMoneyDollarCircleLine} iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20" />
      </div>

      <HealthSummary
        summary={resumo.health}
        title="Saúde das suas obras"
        hrefFor={(status) => `/xgestao/obras?saude=${status}`}
        luminous
      />

      <Card className="border-gray-100 dark:border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Obras recentes</CardTitle>
          <Button asChild variant="ghost" size="sm"><Link href="/xgestao/obras">Ver todas</Link></Button>
        </CardHeader>
        <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
          {obrasProprias.slice(0, 5).map((obra) => (
            <Link
              key={obra.id}
              href={`/xgestao/obras/${obra.id}`}
              className="flex items-center justify-between gap-4 py-4 transition-colors hover:text-primary"
            >
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