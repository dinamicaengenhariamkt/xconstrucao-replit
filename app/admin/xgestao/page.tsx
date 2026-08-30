'use client';

import { StatsCard } from '@features/shared/components/StatsCard';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useXgestaoAdminDashboard } from '@features/xgestao/admin/hooks/use-admin-dashboard';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { RiGroupLine, RiHammerLine, RiLinkM, RiPieChart2Line } from 'react-icons/ri';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

function tierLabel(tier: string) {
  return { free: 'Freemium', pro: 'Basic', enterprise: 'Pro' }[tier] ?? tier;
}

export default function AdminXgestaoPage() {
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminDashboard();
  const indicadores = data?.indicadores;
  const distribuicao = indicadores?.distribuicaoPlanos ?? { free: 0, pro: 0, enterprise: 0 };
  const cards = [
    { label: 'Assinantes', value: String(indicadores?.assinantes ?? 0), icon: RiGroupLine, iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
    { label: 'Obras gerenciadas', value: String(indicadores?.obrasGerenciadas ?? 0), icon: RiHammerLine, iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
    { label: 'Planos', value: `${distribuicao.free} · ${distribuicao.pro} · ${distribuicao.enterprise}`, icon: RiPieChart2Line, iconBgColor: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20' },
    { label: 'Links públicos ativos', value: String(indicadores?.linksPublicosAtivos ?? 0), icon: RiLinkM, iconBgColor: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
  ];

  if (isLoading && !data) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <div><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-80 mt-2" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
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
        <p className="text-sm text-muted-foreground mt-1">Acompanhamento da base e das obras próprias gerenciadas.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatsCard key={card.label} {...card} luminous testId={`xgestao-kpi-${card.label.toLowerCase().replaceAll(' ', '-')}`} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-5">Planos: Freemium · Basic · Pro</p>

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
                    <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Teste até</th>
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
                      <td className="px-4 py-3 text-gray-500">{assinante.fimTeste ? dateFormatter.format(new Date(assinante.fimTeste)) : '—'}</td>
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