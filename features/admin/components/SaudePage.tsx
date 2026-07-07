'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  RiHeartPulseLine,
  RiRefreshLine,
  RiAlertLine,
  RiUserLine,
  RiCheckboxCircleLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiArrowRightLine,
  RiHistoryLine,
  RiExternalLinkFill,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import { cn } from '@shared/lib/utils';

/* ------------------------------------------------------------------ *
 * Tipos                                                               *
 * ------------------------------------------------------------------ */
interface ErroRecente {
  id: number;
  level: string;
  message: string;
  route: string | null;
  source: string;
  createdAt: string;
}

interface JobStatus {
  job: string;
  status: string;
  finishedAt: string | null;
  error: string | null;
}

interface TopRota {
  route: string;
  count: number;
}

interface SaudeData {
  erros: {
    total24h: number;
    totalUltimos7dias: number;
    porNivel: { error: number; warn: number; fatal: number };
    recentes: ErroRecente[];
    topRotas: TopRota[];
  };
  usuarios: {
    ativosUltimas24h: number;
    ativosUltimos7dias: number;
    totalAtivos: number;
  };
  jobs: { ultimaExecucao: JobStatus[] };
  auditoria: { ultimasAcoes: Array<{ action: string; actor: string; createdAt: string }> };
  indicadores: {
    tendenciaErros: 'melhora' | 'piora' | 'estavel';
    errosHoje: number;
    errosOntem: number;
  };
}

/* ------------------------------------------------------------------ *
 * Helpers                                                             *
 * ------------------------------------------------------------------ */
const LEVEL_CLASSES: Record<string, string> = {
  fatal: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  error: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  warn: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  info: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const JOB_STATUS_CLASSES: Record<string, string> = {
  ok: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  running: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 animate-pulse',
};

function levelBadge(level: string) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold uppercase', LEVEL_CLASSES[level] ?? LEVEL_CLASSES.info)}>
      {level}
    </span>
  );
}

function jobBadge(status: string) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold uppercase', JOB_STATUS_CLASSES[status] ?? JOB_STATUS_CLASSES.error)}>
      {status}
    </span>
  );
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  return `${Math.floor(hours / 24)}d atrás`;
}

function truncateRoute(route: string | null) {
  if (!route) return '—';
  return route.length > 50 ? route.slice(0, 47) + '…' : route;
}

/* ------------------------------------------------------------------ *
 * KPI Card                                                            *
 * ------------------------------------------------------------------ */
function KpiCard({
  label,
  value,
  icon: Icon,
  iconBg,
  badge,
  testId,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  badge?: { label: string; className: string };
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div className={cn('p-2.5 rounded-lg', iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
        {badge && (
          <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', badge.className)}>
            {badge.label}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-gray-900 dark:text-gray-50" data-testid={`${testId}-value`}>
          {value}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Tendência                                                           *
 * ------------------------------------------------------------------ */
function TendenciaCard({ tendencia, hoje, ontem }: { tendencia: string; hoje: number; ontem: number }) {
  const cor =
    tendencia === 'melhora'
      ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
      : tendencia === 'piora'
      ? 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      : 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700';

  const Icon =
    tendencia === 'melhora' ? RiArrowDownLine : tendencia === 'piora' ? RiArrowUpLine : RiArrowRightLine;

  const label =
    tendencia === 'melhora'
      ? 'Menos erros hoje do que ontem — tendência positiva!'
      : tendencia === 'piora'
      ? 'Mais erros hoje do que ontem — atenção recomendada.'
      : 'Volume de erros estável em relação a ontem.';

  return (
    <div
      data-testid="tendencia-erros"
      className={cn('flex items-center gap-3 rounded-xl border px-5 py-3', cor)}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium">{label}</span>
      <span className="ml-auto text-xs font-semibold opacity-70">
        Hoje: {hoje} · Ontem: {ontem}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Erros Recentes                                                      *
 * ------------------------------------------------------------------ */
function ErrosRecentesTable({ erros }: { erros: ErroRecente[] }) {
  if (erros.length === 0) {
    return (
      <div
        data-testid="empty-state-no-errors"
        className="flex flex-col items-center justify-center py-10 text-center text-gray-500"
      >
        <RiCheckboxCircleLine className="w-10 h-10 text-emerald-500 mb-2" />
        <p className="font-semibold text-emerald-700 dark:text-emerald-400">Nenhum erro registrado — ótimo sinal!</p>
        <p className="text-sm mt-1">A plataforma está operando sem erros registrados.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="table-erros-recentes">
        <thead>
          <tr className="border-b text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
            <th className="py-2 pr-3 text-left font-medium">Nível</th>
            <th className="py-2 pr-3 text-left font-medium">Mensagem</th>
            <th className="py-2 pr-3 text-left font-medium hidden md:table-cell">Rota</th>
            <th className="py-2 text-right font-medium">Quando</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {erros.map((e) => (
            <tr key={e.id} data-testid={`row-erro-${e.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <td className="py-2 pr-3">{levelBadge(e.level)}</td>
              <td className="py-2 pr-3 max-w-xs">
                <span className="line-clamp-1 text-gray-800 dark:text-gray-200">{e.message}</span>
              </td>
              <td className="py-2 pr-3 hidden md:table-cell text-gray-500 font-mono text-xs">
                {truncateRoute(e.route)}
              </td>
              <td className="py-2 text-right text-gray-400 text-xs whitespace-nowrap">
                {formatRelative(e.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Jobs Status                                                         *
 * ------------------------------------------------------------------ */
function JobsStatusTable({ jobs }: { jobs: JobStatus[] }) {
  if (jobs.length === 0) {
    return (
      <p data-testid="empty-state-no-jobs" className="text-sm text-gray-400 py-4 text-center">
        Jobs ainda não executaram
      </p>
    );
  }
  const failed = jobs.filter((j) => j.status === 'error');
  const ok = jobs.filter((j) => j.status === 'ok');
  return (
    <div className="overflow-x-auto">
      <div className="text-xs text-gray-400 mb-2">
        <span className="text-emerald-600 font-semibold">{ok.length} ok</span>
        {failed.length > 0 && (
          <span className="ml-3 text-red-600 font-semibold">{failed.length} com falha</span>
        )}
      </div>
      <table className="w-full text-sm" data-testid="table-jobs-status">
        <thead>
          <tr className="border-b text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">
            <th className="py-2 pr-3 text-left font-medium">Job</th>
            <th className="py-2 pr-3 text-left font-medium">Status</th>
            <th className="py-2 text-right font-medium">Executado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {jobs.map((j) => (
            <tr key={j.job} data-testid={`row-job-${j.job.replace(/\./g, '-')}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
              <td className="py-2 pr-3 font-mono text-xs text-gray-700 dark:text-gray-300">{j.job}</td>
              <td className="py-2 pr-3">{jobBadge(j.status)}</td>
              <td className="py-2 text-right text-gray-400 text-xs whitespace-nowrap">
                {j.finishedAt ? formatRelative(j.finishedAt) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Top Rotas                                                           *
 * ------------------------------------------------------------------ */
function TopRotasChart({ rotas }: { rotas: TopRota[] }) {
  if (rotas.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">Nenhuma rota com erros nos últimos 7 dias</p>;
  }
  const max = Math.max(...rotas.map((r) => r.count), 1);
  return (
    <div className="space-y-2" data-testid="chart-top-rotas">
      {rotas.map((r) => (
        <div key={r.route} data-testid={`bar-rota-${r.route.replace(/\//g, '-')}`}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-mono text-gray-600 dark:text-gray-400 truncate max-w-[70%]">{r.route}</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200 ml-2">{r.count}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div
              className="bg-orange-400 dark:bg-orange-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.max((r.count / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SaudePage principal                                                 *
 * ------------------------------------------------------------------ */
export function SaudePage() {
  const router = useRouter();

  const { data, isLoading, isError, refetch, isFetching } = useQuery<SaudeData>({
    queryKey: ['/api/admin/saude'],
    queryFn: async () => {
      const res = await fetch('/api/admin/saude');
      if (!res.ok) throw new Error('Erro ao carregar saúde da plataforma');
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
  });

  const jobsOk = data?.jobs.ultimaExecucao.filter((j) => j.status === 'ok').length ?? 0;
  const jobsFail = data?.jobs.ultimaExecucao.filter((j) => j.status === 'error').length ?? 0;
  const totalJobs = data?.jobs.ultimaExecucao.length ?? 0;

  return (
    <div className="p-6 md:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
            <RiHeartPulseLine className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Saúde da Plataforma</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Monitoramento técnico em tempo real · atualiza a cada 30s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="btn-atualizar-saude"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RiRefreshLine className={cn('w-4 h-4 mr-1', isFetching && 'animate-spin')} />
            Atualizar
          </Button>
          <Button
            data-testid="btn-ir-auditoria"
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/auditoria')}
          >
            <RiHistoryLine className="w-4 h-4 mr-1" />
            Auditoria
            <RiExternalLinkFill className="w-3 h-3 ml-1 opacity-60" />
          </Button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-12 rounded-xl" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && !isLoading && (
        <div data-testid="error-state-saude" className="text-center py-12 text-red-500">
          <RiAlertLine className="w-10 h-10 mx-auto mb-2" />
          <p className="font-semibold">Erro ao carregar dados de saúde</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              testId="kpi-erros-24h"
              label="Erros nas últimas 24h"
              value={data.erros.total24h}
              icon={RiAlertLine}
              iconBg={data.erros.total24h > 0 ? 'bg-orange-50 text-orange-500' : 'bg-gray-100 text-gray-400'}
              badge={
                data.erros.porNivel.fatal > 0
                  ? { label: `${data.erros.porNivel.fatal} fatais`, className: 'bg-red-100 text-red-700' }
                  : undefined
              }
            />
            <KpiCard
              testId="kpi-erros-7d"
              label="Erros nos últimos 7 dias"
              value={data.erros.totalUltimos7dias}
              icon={RiAlertLine}
              iconBg="bg-gray-100 text-gray-500"
            />
            <KpiCard
              testId="kpi-usuarios-ativos"
              label="Usuários ativos (24h)"
              value={data.usuarios.ativosUltimas24h}
              icon={RiUserLine}
              iconBg="bg-blue-50 text-blue-500"
              badge={
                data.usuarios.totalAtivos > 0
                  ? { label: `${data.usuarios.totalAtivos} ativos`, className: 'bg-blue-100 text-blue-700' }
                  : undefined
              }
            />
            <KpiCard
              testId="kpi-jobs"
              label="Status dos Jobs"
              value={`${jobsOk}/${totalJobs}`}
              icon={RiCheckboxCircleLine}
              iconBg={jobsFail > 0 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}
              badge={
                jobsFail > 0
                  ? { label: `${jobsFail} falha`, className: 'bg-red-100 text-red-700' }
                  : { label: 'todos ok', className: 'bg-emerald-100 text-emerald-700' }
              }
            />
          </div>

          {/* Tendência */}
          <TendenciaCard
            tendencia={data.indicadores.tendenciaErros}
            hoje={data.indicadores.errosHoje}
            ontem={data.indicadores.errosOntem}
          />

          {/* Erros Recentes + Jobs Status */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RiAlertLine className="w-4 h-4 text-orange-500" />
                  Erros Recentes
                  {data.erros.recentes.length > 0 && (
                    <span className="ml-auto text-xs font-normal text-gray-400">últimos {data.erros.recentes.length}</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ErrosRecentesTable erros={data.erros.recentes} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RiCheckboxCircleLine className="w-4 h-4 text-emerald-500" />
                  Status dos Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <JobsStatusTable jobs={data.jobs.ultimaExecucao} />
              </CardContent>
            </Card>
          </div>

          {/* Top Rotas + Auditoria */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 Rotas com Mais Erros (7 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                <TopRotasChart rotas={data.erros.topRotas} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RiHistoryLine className="w-4 h-4 text-gray-500" />
                  Últimas Ações do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.auditoria.ultimasAcoes.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center" data-testid="empty-state-audit">
                    Nenhuma ação registrada ainda
                  </p>
                ) : (
                  <div className="space-y-2" data-testid="lista-auditoria">
                    {data.auditoria.ultimasAcoes.map((a, i) => (
                      <div
                        key={i}
                        data-testid={`row-auditoria-${i}`}
                        className="flex items-center justify-between gap-2 py-1.5 border-b last:border-0 border-gray-100 dark:border-gray-800"
                      >
                        <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate">
                          {a.action}
                        </span>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                          {formatRelative(a.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  data-testid="btn-ver-auditoria-completa"
                  variant="ghost"
                  size="sm"
                  className="mt-3 w-full text-gray-500"
                  onClick={() => router.push('/admin/auditoria')}
                >
                  Ver auditoria completa
                  <RiExternalLinkFill className="w-3 h-3 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
