'use client';

import Link from 'next/link';
import { use } from 'react';
import { RiArrowLeftLine, RiLinkM } from 'react-icons/ri';
import { Skeleton } from '@shared/components/ui/skeleton';
import { HealthCard } from '@features/shared/health';
import { ProfitCard } from '@features/shared/profit';
import { StatsCard } from '@features/shared/components/StatsCard';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { ObraPublicaShell } from '@features/xgestao/obra-publica/components/ObraPublicaShell';
import { useXgestaoAdminObra } from '@features/xgestao/admin/hooks/use-admin-xgestao';
import { formatCurrency } from '@shared/lib/formatters';
import {
  RiBuilding2Line,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiLineChartLine,
} from 'react-icons/ri';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const somenteData = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (somenteData) return `${somenteData[3]}/${somenteData[2]}/${somenteData[1]}`;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? '—' : dateFormatter.format(data);
}

export default function AdminXgestaoObraDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminObra(id);

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
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const { obra, assinante, saude, lucro, linkPublico, conteudo } = data;

  return (
    <div className="space-y-6 p-6 md:p-10">
      <div>
        <Link
          href="/admin/xgestao/obras"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RiArrowLeftLine /> Voltar para as obras
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">{obra.nome}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {assinante.empreiteira}
          {assinante.responsavel && ` · ${assinante.responsavel}`} · {assinante.email}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          label="Progresso"
          value={`${obra.progresso}%`}
          icon={RiLineChartLine}
          iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20"
        />
        <StatsCard
          label="Orçamento"
          value={formatCurrency(obra.valorTotal)}
          icon={RiMoneyDollarCircleLine}
          iconBgColor="bg-violet-50 text-violet-600 dark:bg-violet-900/20"
        />
        <StatsCard
          label="Recebido"
          value={formatCurrency(obra.valorPago)}
          icon={RiBuilding2Line}
          iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20"
        />
        <StatsCard
          label="Previsão"
          value={formatarData(obra.dataPrevisao)}
          icon={RiCalendarLine}
          iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20"
        />
      </div>

      {/* Saúde e lucro são leitura administrativa: nenhum dos dois vai para o
          link público, porque ambos revelam a margem do assinante. */}
      <div className="grid gap-4 lg:grid-cols-2">
        {saude && <HealthCard health={saude} />}
        <ProfitCard
          metrics={lucro.metrics}
          title="Lucro desta obra"
          description="Receita menos custos lançados pelo assinante."
        />
      </div>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">Link público</h2>
        {linkPublico.ativo ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
              <RiLinkM /> Ativo
            </span>
            <span>
              {linkPublico.visualizacoes === 0
                ? 'Ainda não foi aberto'
                : `${linkPublico.visualizacoes} ${linkPublico.visualizacoes === 1 ? 'visualização' : 'visualizações'}`}
            </span>
            {linkPublico.ultimoAcessoEm && <span>Último acesso: {formatarData(linkPublico.ultimoAcessoEm)}</span>}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">Nenhum link público ativo para esta obra.</p>
        )}
      </section>

      {conteudo && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
            Acompanhamento da obra
          </h2>
          {/* Reusa a visão de leitura do link público, com todas as seções
              liberadas: o administrador vê o conteúdo operacional completo,
              e nenhuma ação de escrita existe neste componente. */}
          <ObraPublicaShell view={conteudo} />
        </section>
      )}
    </div>
  );
}
