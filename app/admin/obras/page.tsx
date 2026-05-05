'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { StatsCard } from '@features/shared/components/StatsCard';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useAdminObras } from '@features/admin/obras/hooks/use-obras-list';
import {
  OBRA_STATUS_LABEL,
  OBRA_STATUS_COLOR,
  OBRA_PROGRESS_COLOR,
} from '@features/admin/obras/types/list';
import type { AdminObraStatus } from '@features/admin/obras/types/list';
import { formatCurrency, formatRange } from '@shared/lib/formatters';
import { getPaginationRange } from '@shared/lib/pagination';
import {
  RiSearchLine,
  RiHammerLine,
  RiArrowRightLine,
  RiCloseLine,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';
import {
  HealthBadge,
  HEALTH_LABELS,
  HEALTH_DOT_CLASSES,
  getMockHealth,
  useSaudeMultiFilter,
} from '@features/shared/health';
import type { HealthStatus } from '@features/shared/health';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination';
import { ITEMS_PER_PAGE, STATUS_OPTIONS, SAUDE_OPTIONS } from '@features/admin/obras/constants';

export default function AdminObrasPage() {
  const { data: obras, isLoading } = useAdminObras();
  const saudeMulti = useSaudeMultiFilter();
  const [statusSelected, setStatusSelected] = useState<AdminObraStatus[]>([]);
  const [tiposSelected, setTiposSelected] = useState<string[]>([]);
  const [progressMin, setProgressMin] = useState('');
  const [progressMax, setProgressMax] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const progressMinNum = progressMin === '' ? undefined : Number(progressMin);
  const progressMaxNum = progressMax === '' ? undefined : Number(progressMax);
  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const stats = useMemo(() => {
    if (!obras) return { total: 0, valorTotal: 0 };
    const valorTotal = obras.reduce((sum, o) => sum + o.valorTotal, 0);
    return { total: obras.length, valorTotal };
  }, [obras]);

  const tiposOptions = useMemo(() => {
    const set = new Set<string>();
    (obras ?? []).forEach((o) => set.add(o.tipo));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((v) => ({ value: v, label: v }));
  }, [obras]);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    let result = obras;
    if (statusSelected.length > 0) {
      result = result.filter((o) => statusSelected.includes(o.status as AdminObraStatus));
    }
    if (saudeMulti.values.length > 0) {
      result = result.filter((o) => saudeMulti.values.includes(getMockHealth(o.id).status));
    }
    if (tiposSelected.length > 0) {
      result = result.filter((o) => tiposSelected.includes(o.tipo));
    }
    if (progressMinNum !== undefined) {
      result = result.filter((o) => o.progresso >= progressMinNum);
    }
    if (progressMaxNum !== undefined) {
      result = result.filter((o) => o.progresso <= progressMaxNum);
    }
    if (valorMinNum !== undefined) {
      result = result.filter((o) => o.valorTotal >= valorMinNum);
    }
    if (valorMaxNum !== undefined) {
      result = result.filter((o) => o.valorTotal <= valorMaxNum);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.nome.toLowerCase().includes(q) ||
          o.clienteNome.toLowerCase().includes(q) ||
          o.empreiteiraNome.toLowerCase().includes(q) ||
          o.codigo.toLowerCase().includes(q),
      );
    }
    return result;
  }, [obras, statusSelected, saudeMulti.values, tiposSelected, progressMinNum, progressMaxNum, valorMinNum, valorMaxNum, searchQuery]);

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (saudeMulti.values.length > 0 ? 1 : 0) +
    (tiposSelected.length > 0 ? 1 : 0) +
    (progressMinNum !== undefined || progressMaxNum !== undefined ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    saudeMulti.setValues([]);
    setTiposSelected([]);
    setProgressMin('');
    setProgressMax('');
    setValorMin('');
    setValorMax('');
    setCurrentPage(1);
  };

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredObras.length / ITEMS_PER_PAGE);
  const paginatedObras = filteredObras.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const kpis = [
    {
      label: 'Total Obras',
      value: String(stats.total),
      icon: RiHammerLine,
      iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    },
    {
      label: 'Valor Total de Obras',
      value: formatCurrency(stats.valorTotal),
      icon: RiMoneyDollarCircleLine,
      iconBgColor: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20',
    },
  ];

  if (isLoading) {
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

      {/* KPI Cards (informativos) */}
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

      {/* Toolbar: filtros avançados + busca */}
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
              label="Saúde"
              options={SAUDE_OPTIONS}
              values={saudeMulti.values}
              onChange={onFilterChange(saudeMulti.setValues)}
              placeholder="Todas"
              testIdPrefix="filter-saude"
            />
            <MultiSelectDropdown
              label="Tipo de obra"
              options={tiposOptions}
              values={tiposSelected}
              onChange={onFilterChange(setTiposSelected)}
              placeholder="Todos os tipos"
              searchPlaceholder="Buscar tipo..."
              testIdPrefix="filter-tipo"
            />
            <RangeNumberInput
              label="Progresso (%)"
              min={progressMin}
              max={progressMax}
              onMinChange={onFilterChange(setProgressMin)}
              onMaxChange={onFilterChange(setProgressMax)}
              placeholderMin="0"
              placeholderMax="100"
              testIdPrefix="filter-progresso"
            />
            <RangeNumberInput
              label="Valor total"
              min={valorMin}
              max={valorMax}
              onMinChange={onFilterChange(setValorMin)}
              onMaxChange={onFilterChange(setValorMax)}
              prefix="R$ "
              placeholderMin="100.000"
              placeholderMax="10.000.000"
              testIdPrefix="filter-valor"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, cliente, empreiteira..."
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
            {saudeMulti.values.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Saúde: ${HEALTH_LABELS[s]}`}
                onRemove={() => saudeMulti.setValues(saudeMulti.values.filter((x) => x !== s))}
                dotClassName={HEALTH_DOT_CLASSES[s]}
                testId={`active-chip-saude-${s}`}
              />
            ))}
            {tiposSelected.map((t) => (
              <ActiveFilterChip
                key={t}
                label={`Tipo: ${t}`}
                onRemove={() => setTiposSelected(tiposSelected.filter((x) => x !== t))}
                testId={`active-chip-tipo-${t}`}
              />
            ))}
            {(progressMinNum !== undefined || progressMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Progresso: ${formatRange(progressMin, progressMax, { suffix: '%' })}`}
                onRemove={() => {
                  setProgressMin('');
                  setProgressMax('');
                }}
                testId="active-chip-progresso"
              />
            )}
            {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Valor: ${formatRange(valorMin, valorMax, { prefix: 'R$ ' })}`}
                onRemove={() => {
                  setValorMin('');
                  setValorMax('');
                }}
                testId="active-chip-valor"
              />
            )}
          </div>
        )}
      </div>

      {/* Table */}
      {filteredObras.length > 0 ? (
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
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden md:table-cell">Saúde</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden xl:table-cell">Progresso</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide hidden lg:table-cell">Valor Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {paginatedObras.map((obra) => {
                    const statusColor = OBRA_STATUS_COLOR[obra.status as AdminObraStatus] ?? '';
                    const progressColor = OBRA_PROGRESS_COLOR[obra.status as AdminObraStatus] ?? 'bg-gray-400';
                    return (
                      <tr
                        key={obra.id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{obra.nome}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{obra.codigo} · {obra.tipo}</p>
                          <p className="text-xs text-gray-400 mt-0.5 md:hidden">{obra.clienteNome}</p>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{obra.clienteNome}</p>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{obra.empreiteiraNome}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', statusColor)}>
                            {OBRA_STATUS_LABEL[obra.status as AdminObraStatus] ?? obra.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 hidden md:table-cell">
                          <HealthBadge status={getMockHealth(obra.id).status} size="sm" />
                        </td>
                        <td className="px-4 py-4 hidden xl:table-cell">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', progressColor)}
                                style={{ width: `${obra.progresso}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 font-medium w-8 text-right">{obra.progresso}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 hidden lg:table-cell text-right">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(obra.valorTotal)}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Pago: {formatCurrency(obra.valorPago)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            href={`/admin/obras/${obra.id}`}
                            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary transition-colors"
                            aria-label={`Ver detalhes de ${obra.nome}`}
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

          {/* Pagination */}
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
