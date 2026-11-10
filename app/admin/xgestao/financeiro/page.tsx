'use client';

import Link from 'next/link';
import { useState } from 'react';
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
import { ROTULO_PROBLEMA_COBRANCA, TIPOS_PROBLEMA_COBRANCA } from '@features/xgestao/admin/lib/cobranca-rotulos';
import { PERIODOS_ADMIN, ROTULO_PERIODO, ROTULO_TIPO_ESTORNO, type PeriodoAdmin } from '@features/xgestao/admin/lib/estornos';
import { RiDownloadLine } from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { cn } from '@shared/lib/utils';

const TIER_LABEL: Record<string, string> = { free: 'Somente leitura', pro: 'Basic anterior', enterprise: 'Pro anterior', basic: 'Basic', basic_plus: 'Basic Plus', premium: 'Premium' };

export default function AdminXgestaoFinanceiroPage() {
  // CRM-11 — período da lista de estornos e chargebacks.
  const [periodo, setPeriodo] = useState<PeriodoAdmin>('mes');
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminFinanceiro(periodo);

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

  const { lucro, faturamento, receita } = data;

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
            label="Sem plano ativo"
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

      {/* XG45 — de onde vem a receita e quanto está saindo ou em risco. */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900" data-testid="xgestao-receita-planos">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Receita por plano</p>
            <p className="text-xs text-muted-foreground" data-testid="xgestao-ticket-medio">
              Ticket médio: <strong className="text-foreground">{receita.ticketMedio === null ? 'sem pagantes' : formatCurrency(receita.ticketMedio)}</strong>
            </p>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[460px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-semibold">Plano</th>
                  <th className="pb-2 text-right font-semibold">Pagantes</th>
                  <th className="pb-2 text-right font-semibold">Recorrente</th>
                  <th className="pb-2 text-right font-semibold">Saindo</th>
                  <th className="pb-2 text-right font-semibold">Pendente</th>
                  <th className="pb-2 text-right font-semibold">No teste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {receita.porPlano.map((linha) => (
                  <tr key={linha.tier} data-testid={`xgestao-receita-plano-${linha.tier}`}>
                    <td className="py-2 font-semibold">{TIER_LABEL[linha.tier] ?? linha.tier}</td>
                    <td className="py-2 text-right">{linha.pagantes}</td>
                    <td className="py-2 text-right font-bold">{formatCurrency(linha.mrr)}</td>
                    <td className="py-2 text-right">{linha.saindo ? `${linha.saindo} · ${formatCurrency(linha.mrrSaindo)}` : '0'}</td>
                    <td className="py-2 text-right">{linha.inadimplentes ? `${linha.inadimplentes} · ${formatCurrency(linha.mrrEmRisco)}` : '0'}</td>
                    <td className="py-2 text-right">{linha.emTeste}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Recorrente conta só quem paga e vai renovar. Quem cancelou continua usando até o fim do mês pago e aparece em Saindo.
            {' '}Em risco: {formatCurrency(receita.mrrEmRisco)} com pagamento pendente; saindo: {formatCurrency(receita.mrrSaindo)}.
            {/* CRM-04 — assinou no teste e ainda não pagou: fora do recorrente. */}
            {' '}<span data-testid="xgestao-receita-aguardando">Aguardando o 1º pagamento: {receita.aguardandoPrimeiroPagamento} ({formatCurrency(receita.mrrAguardando)}/mês, fora do recorrente).</span>
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900" data-testid="xgestao-top-clientes">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Quem mais pagou</p>
          {receita.topClientes.length ? (
            <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
              {receita.topClientes.map((cliente) => (
                <Link
                  key={cliente.userId}
                  href={`/admin/xgestao/assinantes/${cliente.userId}`}
                  className="flex items-center justify-between gap-3 py-2.5 hover:text-primary"
                  data-testid={`xgestao-top-cliente-${cliente.userId}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{cliente.empreiteiraNome}</span>
                    <span className="block truncate text-xs text-muted-foreground">{cliente.pagamentos} mensalidade(s)</span>
                  </span>
                  <span className="shrink-0 text-sm font-extrabold">{formatCurrency(cliente.total)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-muted-foreground">Nenhuma mensalidade recebida ainda.</p>
          )}
        </div>
      </section>

      {/* ADM-03 — cobrança com problema: o card fica na home, a lista aqui. */}
      <section
        id="cobranca"
        className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        data-testid="xgestao-cobranca-problema"
      >
        <p className="text-sm font-semibold text-gray-900 dark:text-white">Cobrança com problema</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {TIPOS_PROBLEMA_COBRANCA.map((t) => `${ROTULO_PROBLEMA_COBRANCA[t]}: ${data.cobranca.totais[t]}`).join(' · ')}
        </p>
        {data.cobranca.itens.length ? (
          <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
            {data.cobranca.itens.map((item) => (
              <Link
                key={item.id}
                href={`/admin/xgestao/assinantes/${item.userId}`}
                className="flex items-center justify-between gap-3 py-2.5 hover:text-primary"
                data-testid={`xgestao-cobranca-${item.tipo}-${item.userId}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{item.empreiteiraNome}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.detalhe}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-xs font-semibold">{ROTULO_PROBLEMA_COBRANCA[item.tipo]}</span>
                  <span className="block text-[11px] text-muted-foreground">{new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">Nenhuma cobrança com problema.</p>
        )}
      </section>

      {/* CRM-11 — estornos e chargebacks separados, por período, com CSV. */}
      <section
        id="estornos"
        className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
        data-testid="xgestao-estornos"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Estornos e chargebacks</p>
          <div className="flex flex-wrap items-center gap-2">
            {PERIODOS_ADMIN.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriodo(p)}
                aria-pressed={periodo === p}
                data-testid={`xgestao-estornos-periodo-${p}`}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  periodo === p
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:text-gray-300',
                )}
              >
                {ROTULO_PERIODO[p]}
              </button>
            ))}
            <Button asChild variant="outline" size="sm" data-testid="xgestao-estornos-exportar">
              <a href={`/api/admin/xgestao/export?tipo=estornos&periodo=${periodo}`}><RiDownloadLine /> Exportar CSV</a>
            </Button>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground" data-testid="xgestao-estornos-totais">
          Estornos: {data.estornos.porTipo.estorno.quantidade} ({formatCurrency(data.estornos.porTipo.estorno.valor)})
          {' · '}Chargebacks: {data.estornos.porTipo.chargeback.quantidade} ({formatCurrency(data.estornos.porTipo.chargeback.valor)})
        </p>
        {data.estornos.itens.length ? (
          <div className="mt-2 divide-y divide-gray-100 dark:divide-gray-800">
            {data.estornos.itens.map((item) => (
              <Link
                key={item.id}
                href={`/admin/xgestao/assinantes/${item.userId}`}
                className="flex items-center justify-between gap-3 py-2.5 hover:text-primary"
                data-testid={`xgestao-estorno-${item.tipo}-${item.userId}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{item.empreiteiraNome}</span>
                  <span className="block truncate text-xs text-muted-foreground">{ROTULO_TIPO_ESTORNO[item.tipo]} · {item.plano}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-extrabold text-red-600 dark:text-red-400">-{formatCurrency(item.valor)}</span>
                  <span className="block text-[11px] text-muted-foreground">{new Date(item.data).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-center text-sm text-muted-foreground">Nenhum estorno ou chargeback no período.</p>
        )}
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
