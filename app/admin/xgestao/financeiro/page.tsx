'use client';

import Link from 'next/link';
import {
  RiArrowLeftLine,
  RiGroupLine,
  RiMoneyDollarCircleLine,
  RiRepeatLine,
  RiUserStarLine,
} from 'react-icons/ri';
import { Skeleton } from '@shared/components/ui/skeleton';
import { StatsCard } from '@features/shared/components/StatsCard';
import { ProfitSummary } from '@features/shared/profit';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { useXgestaoAdminFinanceiro } from '@features/xgestao/admin/hooks/use-admin-xgestao';
import { formatCurrency } from '@shared/lib/formatters';

const TIER_LABEL: Record<string, string> = { free: 'Freemium', pro: 'Basic', enterprise: 'Pro' };

export default function AdminXgestaoFinanceiroPage() {
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminFinanceiro();

  if (isError && !data) {
    return (
      <div className="p-6 md:p-10">
        <AdminDashboardError onRetry={refetch} isRetrying={isFetching} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-6 md:p-10">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const { lucro, faturamento } = data;

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div>
        <Link
          href="/admin/xgestao"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RiArrowLeftLine /> Voltar ao resumo
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Financeiro do xgestão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Duas leituras distintas: o que a plataforma arrecada com assinaturas e o que os assinantes
          lucram nas obras que gerenciam.
        </p>
      </div>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
          Receita da plataforma
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            label="Receita acumulada"
            value={formatCurrency(faturamento.receitaAcumulada)}
            icon={RiMoneyDollarCircleLine}
            iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
          />
          <StatsCard
            label="Recorrente mensal"
            value={formatCurrency(faturamento.receitaRecorrenteMensal)}
            icon={RiRepeatLine}
            iconBgColor="bg-violet-50 text-violet-600 dark:bg-violet-900/20"
          />
          <StatsCard
            label="Assinantes pagantes"
            value={String(faturamento.assinantesPagantes)}
            icon={RiUserStarLine}
            iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20"
          />
          <StatsCard
            label="No plano gratuito"
            value={String(faturamento.assinantesFree)}
            icon={RiGroupLine}
            iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20"
          />
        </div>

        <div className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Distribuição por plano</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {Object.entries(faturamento.distribuicaoPlanos).map(([tier, total]) => (
              <div key={tier} className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {TIER_LABEL[tier] ?? tier}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">{total}</p>
              </div>
            ))}
          </div>
          {/* Registra a diferença de modelo para não ser reaberta: no xgestão a
              receita é assinatura, não retenção sobre o pagamento da obra. */}
          <p className="mt-4 text-xs text-muted-foreground">
            O xgestão é vendido por assinatura. Não há split nem comissão sobre o valor das obras —
            esse modelo é do marketplace.
          </p>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500">
          Lucro dos assinantes
        </h2>
        <ProfitSummary
          summary={lucro}
          title="Lucro consolidado das obras"
          description="Receita menos custos lançados pelos assinantes nas obras do xgestão."
        />
      </section>
    </div>
  );
}
