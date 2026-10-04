'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { RiArrowLeftLine, RiDownloadLine, RiLinkM, RiSearchLine } from 'react-icons/ri';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Button } from '@shared/components/ui/button';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { AssinantesObrasPicker } from '@features/xgestao/admin/components/AssinantesObrasPicker';
import {
  useXgestaoAdminAssinantes,
  useXgestaoAdminObras,
  type XgestaoObraStatus,
} from '@features/xgestao/admin/hooks/use-admin-xgestao';
import type { SituacaoObra } from '@features/xgestao/admin/server/situacao';
import { formatCurrency, formatDate } from '@shared/lib/formatters';
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

const SITUACAO_LABEL: Record<SituacaoObra, string> = {
  atrasada: 'Atrasadas',
  parada: 'Paradas',
  no_prazo: 'No prazo',
};

function situacaoDaUrl(valor: string | null): SituacaoObra | '' {
  return valor && valor in SITUACAO_LABEL ? (valor as SituacaoObra) : '';
}

/** Mesma regra do indicador "Obras atrasadas" do painel: previsão vencida e obra não concluída. */
function estaAtrasada(obra: { dataPrevisao: string | null; status: XgestaoObraStatus }): boolean {
  if (!obra.dataPrevisao || obra.status === 'concluida') return false;
  const hoje = new Date().toISOString().slice(0, 10);
  return obra.dataPrevisao.slice(0, 10) < hoje;
}

/** `useSearchParams` exige boundary de Suspense na renderização estática. */
export default function AdminXgestaoObrasPage() {
  return (
    <Suspense fallback={<div className="p-6 md:p-10"><Skeleton className="h-96 rounded-2xl" /></div>}>
      <ObrasXgestao />
    </Suspense>
  );
}

function ObrasXgestao() {
  // A URL preserva a seleção ao chegar do dashboard/lista e ao navegar de volta.
  const searchParams = useSearchParams();
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [status, setStatus] = useState<XgestaoObraStatus | ''>('');
  // XG36 — o painel abre a lista já filtrada (`?situacao=atrasada|parada|no_prazo`).
  const [situacao, setSituacao] = useState<SituacaoObra | ''>(() => situacaoDaUrl(searchParams.get('situacao')));
  const empreiteiraId = searchParams.get('empreiteira_id') ?? '';
  const [pagina, setPagina] = useState(1);
  const assinantes = useXgestaoAdminAssinantes();
  const selecionada = assinantes.data?.rows.find((item) => item.empreiteiraId === empreiteiraId);

  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminObras({
    busca,
    status: status || undefined,
    empreiteiraId: empreiteiraId || undefined,
    situacao: situacao || undefined,
    pagina,
  });

  // Trocar filtro sem voltar à página 1 deixaria o usuário numa página que
  // pode não existir no novo resultado.
  const aplicar = <T,>(setter: (valor: T) => void) => (valor: T) => {
    setter(valor);
    setPagina(1);
  };
  const selecionarEmpreiteira = (id: string) => {
    setPagina(1);
    router.push(id ? `/admin/xgestao/obras?empreiteira_id=${encodeURIComponent(id)}` : '/admin/xgestao/obras', { scroll: false });
  };

  return (
    <div className="space-y-6 p-6 md:p-10">
      <div>
        <Link
          href="/admin/xgestao"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RiArrowLeftLine /> Voltar ao resumo
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Obras por assinante</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acompanhe as obras próprias de cada empreiteira do xgestão. Somente leitura.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <AssinantesObrasPicker
          assinantes={assinantes.data?.rows ?? []}
          selecionadaId={empreiteiraId}
          onSelecionar={selecionarEmpreiteira}
          carregando={assinantes.isLoading && !assinantes.data}
          erro={assinantes.isError && !assinantes.data}
          onTentarNovamente={() => void assinantes.refetch()}
        />
        <section className="min-w-0 space-y-5" aria-label="Obras da empreiteira selecionada">
          <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">
              {empreiteiraId ? (selecionada?.empreiteiraNome ?? 'Empreiteira selecionada') : 'Todas as obras'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selecionada
                ? `${selecionada.obrasGerenciadas} obras no total · ${selecionada.obrasAtivas} em andamento`
                : empreiteiraId && assinantes.data
                  ? 'Empreiteira não encontrada entre os assinantes xgestão.'
                  : 'Obras próprias das empreiteiras com acesso ao xgestão.'}
            </p>
          </div>
          {/* XG36 — exporta exatamente o que os filtros mostram. */}
          <Button asChild variant="outline" size="sm" data-testid="xgestao-obras-exportar">
            <a href={`/api/admin/xgestao/export?${new URLSearchParams({
              tipo: 'obras',
              ...(busca.trim() ? { q: busca.trim() } : {}),
              ...(status ? { status } : {}),
              ...(situacao ? { situacao } : {}),
              ...(empreiteiraId ? { empreiteira_id: empreiteiraId } : {}),
            }).toString()}`}>
              <RiDownloadLine /> Exportar CSV
            </a>
          </Button>
          </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_180px]">
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
          value={situacao}
          onChange={(event) => aplicar(setSituacao)(event.target.value as SituacaoObra | '')}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          data-testid="xgestao-obras-situacao"
        >
          <option value="">Todas as situações</option>
          {Object.entries(SITUACAO_LABEL).map(([valor, rotulo]) => (
            <option key={valor} value={valor}>{rotulo}</option>
          ))}
        </select>
      </div>

      {isError && !data ? (
        <AdminDashboardError onRetry={() => void refetch()} isRetrying={isFetching} />
      ) : isLoading && !data ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
        </div>
      ) : !data || data.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-muted-foreground dark:border-gray-800">
          <p>
            {selecionada && selecionada.obrasGerenciadas === 0 && !busca && !status && !situacao
              ? 'Esta empreiteira ainda não tem obras.'
              : 'Nenhuma obra encontrada com esses filtros.'}
          </p>
          {empreiteiraId && (
            <Button variant="outline" size="sm" className="mt-4" onClick={() => selecionarEmpreiteira('')}>
              Ver todas as empreiteiras
            </Button>
          )}
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
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Prazo</th>
                    <th className="hidden px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell">Orçamento</th>
                    <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell">Custo real</th>
                    <th className="hidden px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 xl:table-cell">Última atividade</th>
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
                      {/* XG34 — era o percentual de `obras.progresso`, coluna sem escritor. */}
                      <td
                        className={cn(
                          'px-4 py-3 text-right font-semibold',
                          estaAtrasada(obra) && 'text-red-600 dark:text-red-400',
                        )}
                      >
                        {obra.dataPrevisao ? formatDate(obra.dataPrevisao) : '—'}
                      </td>
                      <td className="hidden px-5 py-3 text-right text-gray-600 dark:text-gray-300 sm:table-cell">
                        {formatCurrency(obra.valorTotal)}
                      </td>
                      <td className="hidden px-4 py-3 text-right text-gray-600 dark:text-gray-300 lg:table-cell">
                        {formatCurrency(obra.valorPago)}
                      </td>
                      <td className="hidden px-5 py-3 text-right text-gray-600 dark:text-gray-300 xl:table-cell">
                        {obra.ultimaAtividadeEm ? formatDate(obra.ultimaAtividadeEm) : '—'}
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
        </section>
      </div>
    </div>
  );
}
