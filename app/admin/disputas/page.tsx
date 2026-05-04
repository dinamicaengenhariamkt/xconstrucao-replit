'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  RiAlertLine,
  RiSearchLine,
  RiTimeLine,
  RiCheckboxCircleLine,
  RiFlashlightLine,
  RiSpeedLine,
} from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { StatsCard } from '@features/shared/components/StatsCard';
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
import { getPaginationRange } from '@shared/lib/pagination';
import { formatCurrencyRounded, formatRange } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import {
  useDisputas,
  useDisputasKPI,
} from '@features/admin/disputas/hooks/use-disputas';
import {
  ITEMS_PER_PAGE,
  DISPUTA_STATUS_LABELS,
  DISPUTA_STATUS_BADGE_CLASSES,
  DISPUTA_STATUS_DOT_CLASSES,
  DISPUTA_CATEGORIA_LABELS,
  DISPUTA_PRIORIDADE_LABELS,
  DISPUTA_PRIORIDADE_BADGE_CLASSES,
  DISPUTA_PARTE_LABELS,
} from '@features/admin/disputas/constants';
import type {
  DisputaCategoria,
  DisputaPrioridade,
  DisputaStatus,
} from '@features/admin/disputas/types';

const STATUS_VALUES: DisputaStatus[] = [
  'aberta',
  'em_analise',
  'aguardando_partes',
  'resolvida',
  'escalada',
];
const CATEGORIA_VALUES: DisputaCategoria[] = [
  'pagamento_atrasado',
  'medicao_rejeitada',
  'qualidade_obra',
  'descumprimento_prazo',
  'escopo_contrato',
  'outros',
];
const PRIORIDADE_VALUES: DisputaPrioridade[] = ['alta', 'media', 'baixa'];

function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export default function AdminDisputasPage() {
  const { data: disputas, isLoading } = useDisputas();
  const { data: kpi } = useDisputasKPI();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusSelected, setStatusSelected] = useState<DisputaStatus[]>([]);
  const [categoriaSelected, setCategoriaSelected] = useState<DisputaCategoria[]>([]);
  const [prioridadeSelected, setPrioridadeSelected] = useState<DisputaPrioridade[]>([]);
  const [dataMin, setDataMin] = useState('');
  const [dataMax, setDataMax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    (disputas ?? []).forEach((d) => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return STATUS_VALUES.map((value) => ({
      value,
      label: `${DISPUTA_STATUS_LABELS[value]} (${counts[value] || 0})`,
    }));
  }, [disputas]);

  const categoriaOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    (disputas ?? []).forEach((d) => {
      counts[d.categoria] = (counts[d.categoria] || 0) + 1;
    });
    return CATEGORIA_VALUES.map((value) => ({
      value,
      label: `${DISPUTA_CATEGORIA_LABELS[value]} (${counts[value] || 0})`,
    }));
  }, [disputas]);

  const prioridadeOptions = useMemo(
    () =>
      PRIORIDADE_VALUES.map((value) => ({
        value,
        label: DISPUTA_PRIORIDADE_LABELS[value],
      })),
    [],
  );

  const filtered = useMemo(() => {
    let result = disputas ?? [];
    if (statusSelected.length > 0) {
      result = result.filter((d) => statusSelected.includes(d.status));
    }
    if (categoriaSelected.length > 0) {
      result = result.filter((d) => categoriaSelected.includes(d.categoria));
    }
    if (prioridadeSelected.length > 0) {
      result = result.filter((d) => prioridadeSelected.includes(d.prioridade));
    }
    if (dataMin) result = result.filter((d) => d.dataAbertura >= dataMin);
    if (dataMax) result = result.filter((d) => d.dataAbertura <= dataMax);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.codigo.toLowerCase().includes(q) ||
          d.titulo.toLowerCase().includes(q) ||
          d.obraNome.toLowerCase().includes(q) ||
          d.cliente.nome.toLowerCase().includes(q) ||
          d.empreiteira.nome.toLowerCase().includes(q),
      );
    }
    // Mais novas primeiro.
    return [...result].sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura));
  }, [
    disputas,
    statusSelected,
    categoriaSelected,
    prioridadeSelected,
    dataMin,
    dataMax,
    searchQuery,
  ]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > 1 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [currentPage, totalPages]);

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (categoriaSelected.length > 0 ? 1 : 0) +
    (prioridadeSelected.length > 0 ? 1 : 0) +
    (dataMin || dataMax ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setCategoriaSelected([]);
    setPrioridadeSelected([]);
    setDataMin('');
    setDataMax('');
    setCurrentPage(1);
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10" data-testid="admin-disputas-page">
      <PageHeader
        title="Central de Disputas"
        subtitle="Acompanhe disputas abertas entre clientes e empreiteiras, monitore SLA e registre resoluções."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatsCard
          label="Disputas abertas"
          value={kpi?.totalAbertas ?? 0}
          icon={RiAlertLine}
          iconBgColor="bg-amber-100 text-amber-600 dark:bg-amber-900/30"
          badge={{ label: 'Aguardam ação', variant: 'amber' }}
          testId="kpi-disputas-abertas"
        />
        <StatsCard
          label="Em análise"
          value={kpi?.emAnalise ?? 0}
          icon={RiTimeLine}
          iconBgColor="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
          testId="kpi-disputas-analise"
        />
        <StatsCard
          label="Resolvidas (30d)"
          value={kpi?.resolvidasUltimos30d ?? 0}
          icon={RiCheckboxCircleLine}
          iconBgColor="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
          badge={{ label: 'No mês', variant: 'success' }}
          testId="kpi-disputas-resolvidas"
        />
        <StatsCard
          label="Prioridade alta"
          value={kpi?.prioridadeAlta ?? 0}
          icon={RiFlashlightLine}
          iconBgColor="bg-red-100 text-red-600 dark:bg-red-900/30"
          badge={{ label: 'Atenção', variant: 'red' }}
          testId="kpi-disputas-alta"
        />
        <StatsCard
          label="Prazo médio resolução"
          value={kpi ? `${kpi.prazoMedioResolucaoDias} dias` : '—'}
          icon={RiSpeedLine}
          iconBgColor="bg-purple-100 text-purple-600 dark:bg-purple-900/30"
          badge={
            kpi
              ? {
                  label: kpi.prazoMedioResolucaoDias <= 14 ? 'Rápido' : 'Atenção',
                  variant: kpi.prazoMedioResolucaoDias <= 14 ? 'success' : 'amber',
                }
              : undefined
          }
          testId="kpi-disputas-prazo-medio"
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAllAdvanced}
          >
            <MultiSelectDropdown
              label="Status"
              options={statusOptions}
              values={statusSelected}
              onChange={onFilterChange(setStatusSelected)}
              placeholder="Todos os status"
              testIdPrefix="filter-status"
            />
            <MultiSelectDropdown
              label="Categoria"
              options={categoriaOptions}
              values={categoriaSelected}
              onChange={onFilterChange(setCategoriaSelected)}
              placeholder="Todas as categorias"
              testIdPrefix="filter-categoria"
            />
            <MultiSelectDropdown
              label="Prioridade"
              options={prioridadeOptions}
              values={prioridadeSelected}
              onChange={onFilterChange(setPrioridadeSelected)}
              placeholder="Todas as prioridades"
              testIdPrefix="filter-prioridade"
            />
            <RangeDateInput
              label="Data de abertura"
              min={dataMin}
              max={dataMax}
              onMinChange={onFilterChange(setDataMin)}
              onMaxChange={onFilterChange(setDataMax)}
              testIdPrefix="filter-data"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por código, obra, cliente, empreiteira..."
              value={searchQuery}
              onChange={(e) => onFilterChange(setSearchQuery)(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-disputas"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {statusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${DISPUTA_STATUS_LABELS[s]}`}
                onRemove={() =>
                  onFilterChange(setStatusSelected)(statusSelected.filter((x) => x !== s))
                }
                dotClassName={DISPUTA_STATUS_DOT_CLASSES[s]}
                testId={`active-chip-status-${s}`}
              />
            ))}
            {categoriaSelected.map((c) => (
              <ActiveFilterChip
                key={c}
                label={`Categoria: ${DISPUTA_CATEGORIA_LABELS[c]}`}
                onRemove={() =>
                  onFilterChange(setCategoriaSelected)(
                    categoriaSelected.filter((x) => x !== c),
                  )
                }
                testId={`active-chip-categoria-${c}`}
              />
            ))}
            {prioridadeSelected.map((p) => (
              <ActiveFilterChip
                key={p}
                label={`Prioridade: ${DISPUTA_PRIORIDADE_LABELS[p]}`}
                onRemove={() =>
                  onFilterChange(setPrioridadeSelected)(
                    prioridadeSelected.filter((x) => x !== p),
                  )
                }
                testId={`active-chip-prioridade-${p}`}
              />
            ))}
            {(dataMin || dataMax) && (
              <ActiveFilterChip
                label={`Abertura: ${formatRange(
                  dataMin ? formatDateBR(dataMin) : '',
                  dataMax ? formatDateBR(dataMax) : '',
                )}`}
                onRemove={() => {
                  setDataMin('');
                  setDataMax('');
                }}
                testId="active-chip-data"
              />
            )}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-gray-400">
            Carregando disputas…
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-16">
            <RiAlertLine className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-500">Nenhuma disputa encontrada</p>
            <p className="text-xs text-gray-400 mt-1">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <div className="hidden md:grid grid-cols-[auto_2fr_1.5fr_1fr_1fr_auto_auto] gap-4 px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
              <span>Código</span>
              <span>Disputa</span>
              <span>Partes</span>
              <span>Categoria</span>
              <span>Aberta</span>
              <span>Prioridade</span>
              <span>Status</span>
            </div>

            {paginated.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-1 md:grid-cols-[auto_2fr_1.5fr_1fr_1fr_auto_auto] gap-2 md:gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                data-testid={`disputa-row-${d.id}`}
              >
                <div className="flex items-center">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums">
                    {d.codigo}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {d.titulo}
                  </span>
                  <span className="text-xs text-gray-400 mt-0.5">
                    Obra: {d.obraNome}
                    {d.valorEnvolvido !== undefined &&
                      ` · ${formatCurrencyRounded(d.valorEnvolvido)}`}
                  </span>
                  {d.resolucao && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 italic">
                      Resolução: {d.resolucao}
                    </span>
                  )}
                </div>

                <div className="flex flex-col text-xs text-gray-600 dark:text-gray-400">
                  <span>
                    <strong>Cliente:</strong> {d.cliente.nome}
                  </span>
                  <span>
                    <strong>Empreiteira:</strong> {d.empreiteira.nome}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5">
                    Aberta por {DISPUTA_PARTE_LABELS[d.abertaPor]}
                  </span>
                </div>

                <div className="flex items-center">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {DISPUTA_CATEGORIA_LABELS[d.categoria]}
                  </span>
                </div>

                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">
                    {formatDateBR(d.dataAbertura)}
                  </span>
                  {d.status !== 'resolvida' && (
                    <span className="text-[11px] text-gray-400">
                      há {d.diasAberta} dia{d.diasAberta !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                <div className="flex items-center">
                  <span
                    className={cn(
                      'text-[11px] font-bold px-2 py-1 rounded-full',
                      DISPUTA_PRIORIDADE_BADGE_CLASSES[d.prioridade],
                    )}
                  >
                    {DISPUTA_PRIORIDADE_LABELS[d.prioridade]}
                  </span>
                </div>

                <div className="flex items-center">
                  <span
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap',
                      DISPUTA_STATUS_BADGE_CLASSES[d.status],
                    )}
                  >
                    {DISPUTA_STATUS_LABELS[d.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
                data-testid="disputas-pagination-prev"
              />
            </PaginationItem>
            {getPaginationRange(currentPage, totalPages).map((item, idx) =>
              item === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
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
                    data-testid={`disputas-pagination-page-${item}`}
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
                data-testid="disputas-pagination-next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
