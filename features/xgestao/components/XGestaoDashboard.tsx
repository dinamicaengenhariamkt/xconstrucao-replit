'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  RiBuilding2Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiMoneyDollarCircleLine,
  RiToolsLine,
  RiWallet3Line,
} from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { StatsCard } from '@features/shared/components/StatsCard';
import {
  semaforoFinanceiro,
  semaforoPrazo,
  type Semaforo,
} from '@features/xgestao/lib/indicadores-obra';
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

/**
 * XG27 — o tom de cada sinal.
 *
 * Os tons são os mesmos de `HEALTH_DOT_CLASSES`, mas **copiados, não
 * importados**: reusar o módulo de saúde traria junto o vocabulário
 * "SAUDÁVEL/ATENÇÃO/RISCO" que a XG17 removeu do xgestão por ser ilegível
 * para o dono da obra. O que volta aqui é a paleta, não a régua.
 */
const SEMAFORO_DOT: Record<Semaforo, string> = {
  ok: 'bg-green-500',
  atencao: 'bg-amber-500',
  critico: 'bg-red-500',
  sem_dado: 'bg-gray-300 dark:bg-gray-600',
};

/** As variantes que o `StatsCard` já conhece (`BADGE_CLASSES`). */
const SEMAFORO_BADGE: Record<Semaforo, 'success' | 'warning' | 'error' | 'neutral'> = {
  ok: 'success',
  atencao: 'warning',
  critico: 'error',
  sem_dado: 'neutral',
};

/**
 * Um sinal do dashboard: a cor diz o estado de relance, o texto diz o número.
 *
 * Os dois juntos são o ponto. Cor pura obrigaria o dono da obra a decorar a
 * régua por trás — exatamente o defeito que tirou a Saúde daqui na XG17. O
 * ponto é `aria-hidden` porque o significado inteiro está no texto ao lado.
 */
function LinhaSemaforo({ estado, children }: { estado: Semaforo; children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
      <span aria-hidden className={`size-2 shrink-0 rounded-full ${SEMAFORO_DOT[estado]}`} />
      {children}
    </span>
  );
}

export function XGestaoDashboard() {
  const { data: obras, isLoading, isError } = useMinhasObras();
  const obrasProprias = useMemo(() => (obras ?? []).filter((obra) => obra.isObraPropria), [obras]);

  const resumo = useMemo(() => {
    const concluidas = obrasProprias.filter((obra) => obra.status === 'finalizada').length;
    const ativas = obrasProprias.length - concluidas;
    const orcamento = obrasProprias.reduce((total, obra) => total + obra.orcamento, 0);
    const custoReal = obrasProprias.reduce((total, obra) => total + obra.custoReal, 0);
    /**
     * XG27 — razão de somas, não média de percentuais.
     *
     * Média de percentuais daria a uma obra de R$ 5 mil o mesmo peso de uma de
     * R$ 500 mil, e o card responde "quanto da minha carteira já gastei?". Sem
     * orçamento lançado não há denominador: `null` vira o badge cinza, nunca
     * um verde que afirmaria folga que ninguém verificou.
     */
    const consumo = orcamento > 0 ? Math.round((custoReal / orcamento) * 100) : null;
    const atrasadas = obrasProprias.filter((obra) => obra.diasAtraso > 0).length;
    // XG17 — a contagem por status de saúde saiu junto com o `HealthSummary`.
    // XG27 — e o "Progresso médio" saiu daqui a pedido do cliente: lia
    // `obras.progresso`, coluna sem escritor desde a XG23, e mostrava 0% para
    // obra em pleno andamento.
    return { ativas, concluidas, orcamento, custoReal, consumo, atrasadas };
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
        {/* XG13 — `luminous` (em todos os quatro cards) já existia no `StatsCard`
            e só não era passado aqui: o painel do xgestão renderizava card liso
            enquanto o dashboard do empreiteiro tinha o acabamento completo. Prop
            opt-in, nenhum arquivo compartilhado alterado.
            XG27 — `badge` é a segunda prop nesse mesmo caso: já existia, nunca
            tinha sido usada aqui, e é o que evitou criar componente de semáforo. */}
        {/* XG27 — o outro sinal que o cliente pediu ("se está no prazo"), no card
            que já contava as obras em andamento. Sem atraso nenhum o badge some:
            um "0 atrasadas" verde seria ruído constante para dizer "tudo normal". */}
        <StatsCard
          luminous
          label="Obras ativas"
          value={resumo.ativas}
          icon={RiToolsLine}
          iconBgColor="bg-primary/10 text-primary"
          badge={
            resumo.atrasadas > 0
              ? {
                  label: `${resumo.atrasadas} atrasada${resumo.atrasadas > 1 ? 's' : ''}`,
                  variant: 'error' as const,
                }
              : undefined
          }
        />
        <StatsCard luminous label="Obras concluídas" value={resumo.concluidas} icon={RiCheckboxCircleLine} iconBgColor="bg-success/10 text-success" />
        {/* XG27 — no lugar do "Progresso médio": quanto do orçamento da carteira
            já virou custo, com a cor do estado. Reusa a prop `badge` que o
            `StatsCard` já aceita — nenhum componente novo. */}
        <StatsCard
          luminous
          label="Saúde financeira"
          value={formatCurrency(resumo.custoReal)}
          icon={RiWallet3Line}
          iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
          badge={{
            label: resumo.consumo === null ? 'orçamento não lançado' : `${resumo.consumo}% do orçamento`,
            variant: SEMAFORO_BADGE[semaforoFinanceiro(resumo.consumo)],
          }}
        />
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
              {/* XG27 — aqui ficava `{obra.progresso}% executado`, o 0%/100% do
                  print do cliente. No lugar, os dois sinais que ele pediu:
                  prazo e dinheiro, cada um com o número ao lado da cor. */}
              <div className="shrink-0 space-y-1 text-right">
                <LinhaSemaforo estado={semaforoPrazo(obra.diasAtraso)}>
                  {obra.diasAtraso > 0
                    ? `Atrasada há ${obra.diasAtraso} dia${obra.diasAtraso > 1 ? 's' : ''}`
                    : 'No prazo'}
                </LinhaSemaforo>
                <LinhaSemaforo estado={semaforoFinanceiro(obra.consumoOrcamento)}>
                  {obra.consumoOrcamento === null
                    ? 'Orçamento não lançado'
                    : `${obra.consumoOrcamento}% do orçamento`}
                </LinhaSemaforo>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}