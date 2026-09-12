'use client';

import Link from 'next/link';
import { RiArrowLeftLine } from 'react-icons/ri';
import { Skeleton } from '@shared/components/ui/skeleton';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { useXgestaoAdminAssinantes } from '@features/xgestao/admin/hooks/use-admin-xgestao';
import { formatCurrency } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

const TIER_LABEL: Record<string, string> = { free: 'Freemium', pro: 'Basic', enterprise: 'Pro' };

const STATUS_STYLE: Record<string, string> = {
  ativa: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  inadimplente: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  cancelada: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

export default function AdminXgestaoAssinantesPage() {
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminAssinantes();

  if (isError && !data) {
    return (
      <div className="p-6 md:p-10">
        <AdminDashboardError onRetry={refetch} isRetrying={isFetching} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 md:p-10">
      <div>
        <Link
          href="/admin/xgestao"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RiArrowLeftLine /> Voltar ao resumo
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Assinantes do xgestão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem mantém o acesso ao produto, com plano e obras gerenciadas.
        </p>
      </div>

      {isLoading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-muted-foreground dark:border-gray-800">
          Ainda não há assinantes xgestão.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Empreiteira</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">E-mail</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Obras</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">Plano</th>
                  <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Situação</th>
                  <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 xl:table-cell">Entrada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.rows.map((assinante) => (
                  <tr
                    key={assinante.userId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    data-testid={`xgestao-assinante-${assinante.userId}`}
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/xgestao/obras?empreiteira_id=${assinante.empreiteiraId}`}
                        className="font-semibold text-gray-900 hover:text-primary dark:text-white"
                      >
                        {assinante.empreiteiraNome}
                      </Link>
                      {/* Reinjeta no mobile o que as colunas escondidas mostram. */}
                      <p className="mt-0.5 text-xs text-gray-400 lg:hidden">{assinante.email}</p>
                      <p className="mt-0.5 text-xs text-gray-400 md:hidden">
                        {TIER_LABEL[assinante.plano.tier] ?? assinante.plano.tier}
                        {assinante.plano.valorMensal > 0 && ` · ${formatCurrency(assinante.plano.valorMensal)}/mês`}
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 dark:text-gray-300 lg:table-cell">{assinante.email}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {assinante.obrasGerenciadas}
                      {assinante.obrasAtivas > 0 && (
                        <span className="ml-1 text-xs font-normal text-gray-400">({assinante.obrasAtivas} ativas)</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        {TIER_LABEL[assinante.plano.tier] ?? assinante.plano.tier}
                      </span>
                      {assinante.plano.valorMensal > 0 && (
                        <p className="mt-1 text-xs text-gray-400">{formatCurrency(assinante.plano.valorMensal)}/mês</p>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      {assinante.plano.status ? (
                        <span className={cn(
                          'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          STATUS_STYLE[assinante.plano.status] ?? 'bg-gray-100 text-gray-600',
                        )}>
                          {assinante.plano.status}
                        </span>
                      ) : (
                        // Free não gera cobrança, então não há assinatura para ter situação.
                        <span className="text-xs text-gray-400">sem cobrança</span>
                      )}
                    </td>
                    <td className="hidden px-5 py-3 text-gray-500 xl:table-cell">
                      {dateFormatter.format(new Date(assinante.entradaEm))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
