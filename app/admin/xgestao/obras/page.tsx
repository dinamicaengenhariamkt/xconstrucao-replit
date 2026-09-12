'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { RiArrowLeftLine, RiLinkM, RiSearchLine } from 'react-icons/ri';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Button } from '@shared/components/ui/button';
import { HealthBadge } from '@features/shared/health';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import {
  useXgestaoAdminObras,
  type XgestaoObraStatus,
} from '@features/xgestao/admin/hooks/use-admin-xgestao';
import { formatCurrency } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';

const STATUS_LABEL: Record<XgestaoObraStatus, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em andamento',
  pausada: 'Pausada',
  concluida: 'Concluída',
};

const STATUS_STYLE: Record<XgestaoObraStatus, string> = {
  planejamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  em_andamento: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  concluida: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

/** `useSearchParams` exige boundary de Suspense na renderização estática. */
export default function AdminXgestaoObrasPage() {
  return (
    <Suspense fallback={<div className="p-6 md:p-10"><Skeleton className="h-96 rounded-2xl" /></div>}>
      <ObrasXgestao />
    </Suspense>
  );
}

function ObrasXgestao() {
  // `empreiteira_id` chega da lista de assinantes, que linka para as obras de
  // um assinante específico. Sem ler o parâmetro, o link abriria sem filtro.
  const searchParams = useSearchParams();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<XgestaoObraStatus | ''>('');
  const [empreiteiraId, setEmpreiteiraId] = useState(searchParams.get('empreiteira_id') ?? '');
  const [pagina, setPagina] = useState(1);

  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminObras({
    busca,
    status: status || undefined,
    empreiteiraId: empreiteiraId || undefined,
    pagina,
  });

  // Trocar filtro sem voltar à página 1 deixaria o usuário numa página que
  // pode não existir no novo resultado.
  const aplicar = <T,>(setter: (valor: T) => void) => (valor: T) => {
    setter(valor);
    setPagina(1);
  };

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
        <h1 className="text-2xl font-extrabold tracking-tight">Obras do xgestão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Obras próprias dos assinantes. Somente leitura.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_240px]">
        <div className="relative">
          <RiSearchLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={busca}
            onChange={(event) => aplicar(setBusca)(event.target.value)}
            placeholder="Buscar por obra, empreiteira ou cidade"
            className="pl-9"
            data-testid="xgestao-obras-busca"
          />
        </div>
        <select
          value={status}
          onChange={(event) => aplicar(setStatus)(event.target.value as XgestaoObraStatus | '')}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="xgestao-obras-status"
        >
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>{rotulo}</option>
          ))}
        </select>
        <select
          value={empreiteiraId}
          onChange={(event) => aplicar(setEmpreiteiraId)(event.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="xgestao-obras-empreiteira"
        >
          <option value="">Todas as empreiteiras</option>
          {data?.empreiteiras.map((empreiteira) => (
            <option key={empreiteira.id} value={empreiteira.id}>{empreiteira.nome}</option>
          ))}
        </select>
      </div>

      {isLoading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-muted-foreground dark:border-gray-800">
          Nenhuma obra encontrada com esses filtros.
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Obra</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell">Empreiteira</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">Saúde</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Progresso</th>
                    <th className="hidden px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Orçamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {data.rows.map((obra) => (
                    <tr key={obra.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/xgestao/obras/${obra.id}`}
                          className="font-semibold text-gray-900 hover:text-primary dark:text-white"
                          data-testid={`xgestao-obra-link-${obra.id}`}
                        >
                          {obra.nome}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-400">
                          {[obra.cidade, obra.uf].filter(Boolean).join(' · ') || 'Sem localização'}
                          {obra.linkPublicoAtivo && (
                            <span className="ml-2 inline-flex items-center gap-1 text-primary">
                              <RiLinkM /> link ativo
                            </span>
                          )}
                        </p>
                        {/* Reinjeta no mobile o que as colunas escondidas mostram. */}
                        <p className="mt-0.5 text-xs text-gray-400 md:hidden">{obra.empreiteira}</p>
                        <p className="mt-0.5 text-xs text-gray-400 sm:hidden">{formatCurrency(obra.valorTotal)}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-600 dark:text-gray-300 md:table-cell">{obra.empreiteira}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[obra.status])}>
                          {STATUS_LABEL[obra.status]}
                        </span>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        {obra.saude ? <HealthBadge status={obra.saude.status} size="sm" /> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{obra.progresso}%</td>
                      <td className="hidden px-5 py-3 text-right text-gray-600 dark:text-gray-300 sm:table-cell">
                        {formatCurrency(obra.valorTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {data.totalPaginas > 1 && (
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground">
                Página {data.pagina} de {data.totalPaginas} · {data.total} obras
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagina <= 1}
                  onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.pagina >= data.totalPaginas}
                  onClick={() => setPagina((atual) => atual + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
