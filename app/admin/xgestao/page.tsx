'use client';

import { StatsCard } from '@features/shared/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useXgestaoAdminDashboard } from '@features/xgestao/admin/hooks/use-admin-dashboard';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { formatCurrency } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import {
  RiAlarmWarningLine,
  RiCheckboxCircleLine,
  RiGroupLine,
  RiHammerLine,
  RiLineChartLine,
  RiLinkM,
  RiMoneyDollarCircleLine,
  RiPauseCircleLine,
  RiPieChart2Line,
} from 'react-icons/ri';
import type {
  XgestaoAdminAlerta,
  XgestaoAdminObraStatus,
} from '@features/xgestao/admin/server/dashboard';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

function tierLabel(tier: string) {
  return { free: 'Freemium', pro: 'Basic', enterprise: 'Pro' }[tier] ?? tier;
}

const STATUS_LABEL: Record<XgestaoAdminObraStatus, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em andamento',
  pausada: 'Pausadas',
  concluida: 'Concluídas',
};

const STATUS_STYLE: Record<XgestaoAdminObraStatus, string> = {
  planejamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  em_andamento: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  concluida: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const ALERT_STYLE: Record<XgestaoAdminAlerta['severidade'], string> = {
  critica: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300',
  atencao: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
};

export default function AdminXgestaoPage() {
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminDashboard();
  const indicadores = data?.indicadores;
  const distribuicao = indicadores?.distribuicaoPlanos ?? { free: 0, pro: 0, enterprise: 0 };
  const saldoPrevisto = (indicadores?.orcamentoGerenciado ?? 0) - (indicadores?.valorPago ?? 0);
  const cards = [
    { label: 'Assinantes', value: String(indicadores?.assinantes ?? 0), icon: RiGroupLine, iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
    { label: 'Obras ativas', value: String(indicadores?.obrasAtivas ?? 0), icon: RiHammerLine, iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
    { label: 'Progresso médio', value: `${indicadores?.progressoMedio ?? 0}%`, icon: RiLineChartLine, iconBgColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
    { label: 'Orçamento gerenciado', value: formatCurrency(indicadores?.orcamentoGerenciado ?? 0), icon: RiMoneyDollarCircleLine, iconBgColor: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20' },
  ];

  if (isLoading && !data) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <div><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-80 mt-2" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <AdminDashboardError
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-xgestao-page">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">xgestão</h1>
        <p className="text-sm text-muted-foreground mt-1">Visão operacional e financeira das obras próprias gerenciadas.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatsCard key={card.label} {...card} luminous testId={`xgestao-kpi-${card.label.toLowerCase().replaceAll(' ', '-')}`} />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-gray-100 dark:border-gray-800 lg:col-span-2" data-testid="xgestao-operacao-resumo">
          <CardHeader>
            <CardTitle className="text-lg">Operação das obras</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(STATUS_LABEL) as XgestaoAdminObraStatus[]).map((status) => (
              <div key={status} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_STYLE[status])}>
                  {STATUS_LABEL[status]}
                </span>
                <span className="text-xl font-extrabold">{indicadores?.distribuicaoStatus[status] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-financeiro-resumo">
          <CardHeader>
            <CardTitle className="text-lg">Resumo financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Valor registrado como pago</p>
              <p className="mt-1 text-2xl font-extrabold">{formatCurrency(indicadores?.valorPago ?? 0)}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, indicadores?.orcamentoGerenciado
                    ? ((indicadores.valorPago / indicadores.orcamentoGerenciado) * 100)
                    : 0)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={saldoPrevisto < 0 ? 'font-semibold text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
                {saldoPrevisto < 0 ? 'Acima do orçamento' : 'Saldo previsto'}
              </span>
              <span className={cn('font-bold', saldoPrevisto < 0 && 'text-red-600 dark:text-red-400')}>
                {formatCurrency(Math.abs(saldoPrevisto))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><RiLinkM /> Links ativos</span>
              <span className="font-bold">{indicadores?.linksPublicosAtivos ?? 0}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <RiPieChart2Line /> Distribuição dos planos
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60"><strong className="block">{distribuicao.free}</strong><span className="text-[10px] text-muted-foreground">Freemium</span></div>
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60"><strong className="block">{distribuicao.pro}</strong><span className="text-[10px] text-muted-foreground">Basic</span></div>
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60"><strong className="block">{distribuicao.enterprise}</strong><span className="text-[10px] text-muted-foreground">Pro</span></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-obras-recentes">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Obras recentes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Somente obras próprias de assinantes com acesso xgestão.</p>
            </div>
            <span className="text-sm font-bold text-muted-foreground">{indicadores?.obrasGerenciadas ?? 0} no total</span>
          </CardHeader>
          <CardContent>
            {data?.obras.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.obras.map((obra) => (
                  <div key={obra.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_110px_130px] sm:items-center" data-testid={`xgestao-obra-${obra.id}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold">{obra.nome}</p>
                        {obra.linkPublicoAtivo && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <RiLinkM /> Link ativo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {obra.empreiteira} · {[obra.cidade, obra.uf].filter(Boolean).join(' - ') || 'Local não informado'}
                      </p>
                    </div>
                    <div>
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_STYLE[obra.status])}>
                        {STATUS_LABEL[obra.status]}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-extrabold">{obra.progresso}%</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(obra.valorTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                Ainda não há obras próprias no xgestão.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-alertas">
          <CardHeader>
            <CardTitle className="text-lg">Alertas operacionais</CardTitle>
            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {data?.alertas.totais.ocorrenciasAbertas ?? 0} ocorrências
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                {data?.alertas.totais.pagamentosAtrasados ?? 0} pagamentos
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {data?.alertas.totais.obrasPausadas ?? 0} pausadas
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {data?.alertas.itens.length ? (
              <div className="space-y-3">
                {data.alertas.itens.map((alerta) => (
                  <div key={alerta.id} className={cn('rounded-xl border p-3', ALERT_STYLE[alerta.severidade])}>
                    <div className="flex items-start gap-2">
                      {alerta.tipo === 'obra_pausada' ? <RiPauseCircleLine className="mt-0.5 shrink-0" /> : <RiAlarmWarningLine className="mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{alerta.titulo}</p>
                        <p className="mt-0.5 text-xs opacity-90">{alerta.descricao}</p>
                        <p className="mt-1 truncate text-[11px] opacity-70">{alerta.obra}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <RiCheckboxCircleLine className="size-9 text-emerald-500" />
                <p className="mt-3 text-sm font-bold">Nenhum alerta operacional</p>
                <p className="mt-1 text-xs text-muted-foreground">Não há ocorrências abertas, atrasos ou obras pausadas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Assinantes xgestão</h2>
          <p className="text-sm text-muted-foreground">Recorte exclusivo do produto adicional; não altera as assinaturas do marketplace.</p>
        </div>
        {data?.assinantes.length ? (
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Empreiteira</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">E-mail</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Obras</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Plano</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Distribuição</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Entrada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {data.assinantes.map((assinante) => (
                    <tr key={assinante.id} data-testid={`xgestao-assinante-${assinante.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{assinante.empreiteira}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{assinante.email}</td>
                      <td className="px-4 py-3 text-right font-semibold">{assinante.obrasGerenciadas}</td>
                      <td className="px-4 py-3"><span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{tierLabel(assinante.plano.tier)}</span></td>
                      <td className="px-4 py-3 text-gray-500">
                        {assinante.plano.nome || tierLabel(assinante.plano.tier)}
                      </td>
                      <td className="px-5 py-3 text-gray-500">{dateFormatter.format(new Date(assinante.entradaEm))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-muted-foreground">
            Ainda não há assinantes xgestão.
          </div>
        )}
      </section>
    </div>
  );
}