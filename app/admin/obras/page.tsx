'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { StatsCard } from '@features/shared/components/StatsCard';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useAdminObras } from '@features/admin/obras/hooks/use-obras-list';
import { useObrasHealthMap, summarizeHealthMap } from '@features/shared/health/hooks/use-obras-health';
import { HealthBadge } from '@features/shared/health/components/HealthBadge';
import { HealthSummary } from '@features/shared/health/components/HealthSummary';
import {
  OBRA_STATUS_LABEL,
  OBRA_STATUS_COLOR,
  OBRA_PROGRESS_COLOR,
  OBRA_VISIBILIDADE_LABEL,
  OBRA_VISIBILIDADE_COLOR,
} from '@features/admin/obras/types/list';
import type {
  AdminObraStatus,
  AdminObraProduto,
  AdminObraVisibilidade,
} from '@features/admin/obras/types/list';
import { formatCurrency } from '@shared/lib/formatters';
import { getPaginationRange } from '@shared/lib/pagination';
import {
  RiSearchLine,
  RiHammerLine,
  RiArrowRightLine,
  RiCloseLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeDateInput } from '@features/shared/components/filters/RangeDateInput';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination';

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: AdminObraStatus; label: string }[] = (
  Object.keys(OBRA_STATUS_LABEL) as AdminObraStatus[]
).map((s) => ({ value: s, label: OBRA_STATUS_LABEL[s] }));

const VISIBILIDADE_OPTIONS: { value: AdminObraVisibilidade; label: string }[] = (
  Object.keys(OBRA_VISIBILIDADE_LABEL) as AdminObraVisibilidade[]
).map((v) => ({ value: v, label: OBRA_VISIBILIDADE_LABEL[v] }));

const toNum = (v: string | null | undefined): number => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function AdminObrasPage() {
  const [statusSelected, setStatusSelected] = useState<AdminObraStatus[]>([]);
  const [visibilidadeSelected, setVisibilidadeSelected] = useState<AdminObraVisibilidade[]>([]);
  const [clienteId, setClienteId] = useState('');
  const [empreiteiraId, setEmpreiteiraId] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [produto, setProduto] = useState<AdminObraProduto | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useAdminObras({
    page: currentPage,
    pageSize: PAGE_SIZE,
    status: statusSelected[0],
    visibilidade: visibilidadeSelected[0],
    clienteId: clienteId.trim() || undefined,
    empreiteiraId: empreiteiraId.trim() || undefined,
    periodoInicio: periodoInicio || undefined,
    periodoFim: periodoFim || undefined,
    q: searchQuery || undefined,
    produto: produto || undefined,
  });

  const obras = data?.rows ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  // J57 — saúde real das obras (mapa obraId → ObraHealth) para badge por linha
  // e resumo saudável/atenção/risco no topo. Reusa o módulo health do contratante.
  const { data: healthMap } = useObrasHealthMap('admin');
  const healthSummary = useMemo(() => summarizeHealthMap(healthMap), [healthMap]);

  const valorPaginaAtual = useMemo(
    () => obras.reduce((sum, o) => sum + toNum(o.valorTotal), 0),
    [obras],
  );

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (visibilidadeSelected.length > 0 ? 1 : 0) +
    (clienteId ? 1 : 0) +
    (empreiteiraId ? 1 : 0) +
    (periodoInicio || periodoFim ? 1 : 0) +
    (produto ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setVisibilidadeSelected([]);
    setClienteId('');
    setEmpreiteiraId('');
    setPeriodoInicio('');
    setPeriodoFim('');
    setProduto('');
    setCurrentPage(1);
  };

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  const kpis = [
    {
      label: 'Total Obras',
      value: String(total),
      icon: RiHammerLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    },
    {
      label: 'Valor na página',
      value: formatCurrency(valorPaginaAtual),
      icon: RiMoneyDollarCircleLine,
      iconBgColor: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    },
  ];

  if (isLoading && !data) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 w-44 rounded-lg" />
          <Skeleton className="h-10 w-full sm:max-w-md sm:ml-auto rounded-md" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-obras-page">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Obras
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Listagem de todas as obras cadastradas na plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {kpis.map((kpi) => (
          <StatsCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            icon={kpi.icon}
            iconBgColor={kpi.iconBgColor}
            testId={`kpi-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}
            luminous
          />
        ))}
      </div>

      {/* J57 — resumo de saúde do portfólio (saudável / atenção / risco). */}
      <HealthSummary summary={healthSummary} luminous />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAllAdvanced}
          >
            <MultiSelectDropdown
              label="Status"
              options={STATUS_OPTIONS}
              values={statusSelected}
              onChange={onFilterChange(setStatusSelected)}
              placeholder="Todos os status"
              testIdPrefix="filter-status"
            />
            <MultiSelectDropdown
              label="Visibilidade"
              options={VISIBILIDADE_OPTIONS}
              values={visibilidadeSelected}
              onChange={onFilterChange(setVisibilidadeSelected)}
              placeholder="Todas as visibilidades"
              testIdPrefix="filter-visibilidade"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Cliente (ID)
              </label>
              <Input
                value={clienteId}
                onChange={(e) => onFilterChange(setClienteId)(e.target.value)}
                placeholder="UUID do cliente"
                className="h-9"
                data-testid="filter-cliente-id"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                Empreiteira (ID)
              </label>
              <Input
                value={empreiteiraId}
                onChange={(e) => onFilterChange(setEmpreiteiraId)(e.target.value)}
                placeholder="UUID da empreiteira"
                className="h-9"
                data-testid="filter-empreiteira-id"
              />
            </div>
            <RangeDateInput
              label="Período de criação"
              min={periodoInicio}
              max={periodoFim}
              onMinChange={onFilterChange(setPeriodoInicio)}
              onMaxChange={onFilterChange(setPeriodoFim)}
              testIdPrefix="filter-periodo"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Produto</label>
              <select
                value={produto}
                onChange={(event) => onFilterChange(setProduto)(event.target.value as AdminObraProduto | '')}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                data-testid="filter-produto"
              >
                <option value="">Todos os produtos</option>
                <option value="marketplace">Marketplace</option>
                <option value="xgestao">xgestão</option>
              </select>
            </div>
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, cidade, endereço..."
              value={searchQuery}
              onChange={(e) => onFilterChange(setSearchQuery)(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-obras"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {statusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${OBRA_STATUS_LABEL[s]}`}
                onRemove={() => setStatusSelected(statusSelected.filter((x) => x !== s))}
                testId={`active-chip-status-${s}`}
              />
            ))}
            {visibilidadeSelected.map((v) => (
              <ActiveFilterChip
                key={v}
                label={`Visibilidade: ${OBRA_VISIBILIDADE_LABEL[v]}`}
                onRemove={() => setVisibilidadeSelected(visibilidadeSelected.filter((x) => x !== v))}
                testId={`active-chip-visibilidade-${v}`}
              />
            ))}
            {clienteId && (
              <ActiveFilterChip
                label={`Cliente: ${clienteId.slice(0, 8)}…`}
                onRemove={() => setClienteId('')}
                testId="active-chip-cliente"
              />
            )}
            {empreiteiraId && (
              <ActiveFilterChip
                label={`Empreiteira: ${empreiteiraId.slice(0, 8)}…`}
                onRemove={() => setEmpreiteiraId('')}
                testId="active-chip-empreiteira"
              />
            )}
            {(periodoInicio || periodoFim) && (
              <ActiveFilterChip
                label={`Período: ${periodoInicio || '…'} → ${periodoFim || '…'}`}
                onRemove={() => {
                  setPeriodoInicio('');
                  setPeriodoFim('');
                }}
                testId="active-chip-periodo"
              />
            )}
            {produto && (
              <ActiveFilterChip
                label={`Produto: ${produto === 'xgestao' ? 'xgestão' : 'Marketplace'}`}
                onRemove={() => setProduto('')}
                testId="active-chip-produto"
              />
            )}
          </div>
        )}
      </div>

      {obras.length > 0 ? (
        <>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Obra</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden md:table-cell">Cliente</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden lg:table-cell">Empreiteira</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden md:table-cell">Visibilidade</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden xl:table-cell">Progresso</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden lg:table-cell">Valor Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {obras.map((obra) => {
                    const statusColor = OBRA_STATUS_COLOR[obra.status] ?? '';
                    const visColor = OBRA_VISIBILIDADE_COLOR[obra.visibilidade] ?? '';
                    const progressColor = OBRA_PROGRESS_COLOR[obra.status] ?? 'bg-gray-400';
                    const progresso = obra.progresso ?? 0;
                    const valorTotal = toNum(obra.valorTotal);
                    const valorPago = toNum(obra.valorPago);
                    const cidadeUf = [obra.cidade, obra.uf].filter(Boolean).join(' - ');
                    return (
                      <tr
                        key={obra.id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        data-testid={`row-obra-${obra.id}`}
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{obra.nome}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {obra.tipo ?? '—'}
                            {cidadeUf ? ` · ${cidadeUf}` : ''}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 md:hidden">{obra.clienteNome ?? '—'}</p>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{obra.clienteNome ?? '—'}</p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{obra.empreiteiraNome ?? '—'}</p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', statusColor)}>
                              {OBRA_STATUS_LABEL[obra.status] ?? obra.status}
                            </span>
                            {healthMap?.[obra.id] && (
                              <HealthBadge status={healthMap[obra.id].status} size="sm" variant="subtle" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', visColor)}>
                            {OBRA_VISIBILIDADE_LABEL[obra.visibilidade] ?? obra.visibilidade}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden xl:table-cell">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', progressColor)}
                                style={{ width: `${progresso}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-medium w-8 text-right">{progresso}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(valorTotal)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Pago: {formatCurrency(valorPago)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/obras/${obra.id}`}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary transition-colors"
                            aria-label={`Ver detalhes de ${obra.nome}`}
                            data-testid={`link-obra-${obra.id}`}
                          >
                            <RiArrowRightLine className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    data-testid="obras-pagination-prev"
                  />
                </PaginationItem>
                {getPaginationRange(currentPage, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`obras-ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === item}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(item);
                        }}
                        data-testid={`obras-pagination-page-${item}`}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    data-testid="obras-pagination-next"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <RiCloseLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Tente alterar os filtros ou a busca.</p>
        </div>
      )}
    </div>
  );
}
