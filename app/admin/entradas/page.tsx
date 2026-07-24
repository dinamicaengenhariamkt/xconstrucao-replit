'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  RiArrowUpLine,
  RiFileChartLine,
  RiMedalLine,
  RiAddCircleLine,
  RiUserLine,
  RiBuildingLine,
  RiSearchLine,
  RiCalendarLine,
} from 'react-icons/ri';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { Calendar } from '@shared/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/components/ui/popover';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@shared/components/ui/table';
import { cn } from '@shared/lib/utils';
import { StatsCard } from '@features/admin/financeiro/components/StatsCard';
import { EntradaChart } from '@features/admin/entradas/components/EntradaChart';
import { EntradaTopEntidades } from '@features/admin/entradas/components/EntradaTopEntidades';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
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
import type {
  EntradaPeriodo,
  EntradaTipoReceita,
  EntradaOrigem,
  EntradaStatus,
  Entrada,
  DateRange,
} from '@features/admin/entradas/types';
import {
  useEntradaKpi,
  useEntradas,
  useEntradaChart,
  useTopClientes,
  useTopEmpreiteiras,
} from '@features/admin/entradas/hooks/use-entradas';
import { formatCurrencyRounded as formatCurrency, formatDateTime } from '@shared/lib/formatters';
import {
  tipoReceitaLabels,
  tipoReceitaClasses,
  origemLabels,
  statusLabels,
  statusClasses,
  ORIGEM_OPTIONS,
  TIPO_RECEITA_OPTIONS,
  STATUS_OPTIONS,
  PERIOD_OPTIONS,
  PAGE_SIZE,
} from '@features/admin/entradas/constants';

function formatRangeLabel(range: DateRange | undefined): string {
  if (!range) return 'Personalizado';
  const from = format(range.from, 'dd/MM', { locale: ptBR });
  const to = range.to ? format(range.to, 'dd/MM', { locale: ptBR }) : '...';
  return `${from} – ${to}`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function EntradasSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-36">
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <Skeleton className="h-72 w-full rounded-xl" />
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Skeleton className="h-96 w-full rounded-xl" />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AdminEntradasPage() {
  const [periodo, setPeriodo] = useState<EntradaPeriodo>('30dias');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Filtros do topo (afetam tabela de lançamentos)
  const [origemSelected, setOrigemSelected] = useState<EntradaOrigem[]>([]);
  const [tipoReceitaSelected, setTipoReceitaSelected] = useState<EntradaTipoReceita[]>([]);

  // Filtros da tabela "Lançamentos"
  const [tabelaTipoSelected, setTabelaTipoSelected] = useState<EntradaTipoReceita[]>([]);
  const [tabelaStatusSelected, setTabelaStatusSelected] = useState<EntradaStatus[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  function handleDayPickerSelect(range: DayPickerRange | undefined) {
    if (!range?.from) { setCustomRange(undefined); return; }
    setCustomRange({ from: range.from, to: range.to });
    if (range.from && range.to) setPopoverOpen(false);
  }

  function handlePeriodoChange(p: EntradaPeriodo) {
    if (p !== 'personalizado') setCustomRange(undefined);
    setPeriodo(p);
    setPage(1);
    if (p === 'personalizado') setPopoverOpen(true);
  }

  const topoActiveCount =
    (origemSelected.length > 0 ? 1 : 0) + (tipoReceitaSelected.length > 0 ? 1 : 0);

  const clearTopoFilters = () => {
    setOrigemSelected([]);
    setTipoReceitaSelected([]);
    setPage(1);
  };

  const onTopoFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const { data: kpi, isLoading: isLoadingKpi } = useEntradaKpi(periodo);
  const { data: entradas, isLoading: isLoadingEntradas } = useEntradas(periodo, customRange);
  const { data: chartData, isLoading: isLoadingChart } = useEntradaChart(periodo);
  const { data: topClientes, isLoading: isLoadingClientes } = useTopClientes(periodo);
  const { data: topEmpreiteiras, isLoading: isLoadingEmpreiteiras } = useTopEmpreiteiras(periodo);

  const isLoading =
    isLoadingKpi || isLoadingEntradas || isLoadingChart || isLoadingClientes || isLoadingEmpreiteiras;

  const filtered = useMemo(() => {
    let result = entradas ?? [];
    // Filtros do topo (origem + tipo de receita)
    if (origemSelected.length > 0) {
      result = result.filter((e) => origemSelected.includes(e.origem));
    }
    if (tipoReceitaSelected.length > 0) {
      result = result.filter((e) => tipoReceitaSelected.includes(e.tipoReceita));
    }
    // Filtros da tabela
    if (tabelaTipoSelected.length > 0) {
      result = result.filter((e) => tabelaTipoSelected.includes(e.tipoReceita));
    }
    if (tabelaStatusSelected.length > 0) {
      result = result.filter((e) => tabelaStatusSelected.includes(e.status));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.descricao.toLowerCase().includes(q) ||
          e.clienteEmpreiteira.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entradas, origemSelected, tipoReceitaSelected, tabelaTipoSelected, tabelaStatusSelected, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabelaActiveCount =
    (tabelaTipoSelected.length > 0 ? 1 : 0) + (tabelaStatusSelected.length > 0 ? 1 : 0);

  const clearTabelaAdvanced = () => {
    setTabelaTipoSelected([]);
    setTabelaStatusSelected([]);
    setPage(1);
  };

  const onTabelaFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const kpiCards = useMemo(() => {
    if (!kpi) return [];
    return [
      {
        label: 'Total de entradas',
        value: formatCurrency(kpi.totalEntradas),
        icon: RiArrowUpLine,
        iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
        // Sinal e cor derivados do valor (J40 P1 #9): antes o '+' e o
        // variant eram fixos, então uma queda de 15% renderizava
        // "+-15,0% vs. anterior" com badge verde de sucesso.
        badge: {
          label: `${kpi.crescimentoPercent > 0 ? '+' : ''}${kpi.crescimentoPercent
            .toFixed(1)
            .replace('.', ',')}% vs. anterior`,
          variant: kpi.crescimentoPercent < 0 ? ('error' as const) : ('success' as const),
        },
      },
      {
        label: 'Taxas sobre medições',
        value: formatCurrency(kpi.taxasMedicoes),
        icon: RiFileChartLine,
        iconBgColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: {
          label: `${kpi.taxasMedicoesPercent.toFixed(1).replace('.', ',')}% das entradas`,
          variant: 'info' as const,
        },
      },
      {
        label: 'Assinaturas',
        value: formatCurrency(kpi.assinaturas),
        icon: RiMedalLine,
        iconBgColor: 'bg-[#22846D]/10 text-[#22846D]',
        badge: {
          label: `${kpi.assinaturasPercent.toFixed(1).replace('.', ',')}% das entradas`,
          variant: 'success' as const,
        },
      },
      {
        label: 'Outros serviços',
        value: formatCurrency(kpi.outrosServicos),
        icon: RiAddCircleLine,
        iconBgColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        badge: {
          label: `${kpi.outrosServicosPercent.toFixed(1).replace('.', ',')}% das entradas`,
          variant: 'warning' as const,
        },
      },
      {
        label: 'Ticket médio por cliente',
        value: formatCurrency(kpi.ticketMedioPorCliente),
        icon: RiUserLine,
        iconBgColor: 'bg-primary/10 text-primary',
        badge: { label: 'No período', variant: 'primary' as const },
      },
      {
        label: 'Ticket médio por obra',
        value: formatCurrency(kpi.ticketMedioPorObra),
        icon: RiBuildingLine,
        iconBgColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: { label: 'No período', variant: 'info' as const },
      },
    ];
  }, [kpi]);

  if (isLoading) return <EntradasSkeleton />;

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* ─── BLOCO 1: Header ─── */}
      <div>
        {kpi && (
          <p className="text-sm font-bold text-[#22846D] mb-1">
            Entradas cresceram {kpi.crescimentoPercent.toFixed(1).replace('.', ',')}% em relação aos 30 dias anteriores
          </p>
        )}
        <h1
          className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight"
          data-testid="text-page-title"
        >
          Entradas
        </h1>
        <p className="text-muted-foreground mt-1">
          Detalhamento das receitas da plataforma por período, origem e tipo.
        </p>
      </div>

      {/* ─── BLOCO 2: Filtros do período (escopo: KPIs + gráfico) ─── */}
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Filtros globais
            </p>
            <p className="text-xs text-muted-foreground">
              Período aplicado aos KPIs, gráfico e lançamentos · Origem e tipo refinam a tabela de lançamentos
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
          {/* Seletor de período */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-wrap">
            {PERIOD_OPTIONS.map((opt) => {
              const isActive = periodo === opt.value;
              const isPersonalizado = opt.value === 'personalizado';

              const button = (
                <button
                  key={opt.value}
                  onClick={() => handlePeriodoChange(opt.value)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                    isActive
                      ? 'bg-primary text-white font-bold shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm'
                  )}
                >
                  {isPersonalizado && <RiCalendarLine className="w-3.5 h-3.5 shrink-0" />}
                  {isPersonalizado && isActive ? formatRangeLabel(customRange) : opt.label}
                </button>
              );

              if (!isPersonalizado) return button;

              return (
                <Popover key={opt.value} open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>{button}</PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="range"
                      selected={customRange as DayPickerRange | undefined}
                      onSelect={handleDayPickerSelect}
                      disabled={{ after: new Date() }}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>

          <div className="lg:ml-auto">
            <AdvancedFiltersPopover
              activeCount={topoActiveCount}
              onClearAll={clearTopoFilters}
            >
              <MultiSelectDropdown
                label="Origem"
                options={ORIGEM_OPTIONS}
                values={origemSelected}
                onChange={onTopoFilterChange(setOrigemSelected)}
                placeholder="Todas as origens"
                testIdPrefix="topo-filter-origem"
              />
              <MultiSelectDropdown
                label="Tipo de receita"
                options={TIPO_RECEITA_OPTIONS}
                values={tipoReceitaSelected}
                onChange={onTopoFilterChange(setTipoReceitaSelected)}
                placeholder="Todos os tipos"
                testIdPrefix="topo-filter-tipo"
              />
            </AdvancedFiltersPopover>
          </div>
        </div>

        {topoActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {origemSelected.map((o) => (
              <ActiveFilterChip
                key={o}
                label={`Origem: ${origemLabels[o]}`}
                onRemove={() => setOrigemSelected(origemSelected.filter((x) => x !== o))}
                testId={`topo-active-chip-origem-${o}`}
              />
            ))}
            {tipoReceitaSelected.map((t) => (
              <ActiveFilterChip
                key={t}
                label={`Tipo: ${tipoReceitaLabels[t]}`}
                onRemove={() => setTipoReceitaSelected(tipoReceitaSelected.filter((x) => x !== t))}
                testId={`topo-active-chip-tipo-${t}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── BLOCO 3: 6 KPI Cards ─── */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
        initial="hidden"
        animate="show"
      >
        {kpiCards.map((kpiCard) => (
          <motion.div
            key={kpiCard.label}
            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
          >
            <StatsCard {...kpiCard} luminous />
          </motion.div>
        ))}
      </motion.div>

      {/* ─── BLOCO 4: Gráfico ─── */}
      <EntradaChart data={chartData?.chart} insights={chartData?.insights} luminous />

      {/* ─── BLOCO 5: Tabela de Lançamentos ─── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden luminous-section">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Lançamentos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Detalhamento por operação no período
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AdvancedFiltersPopover
              activeCount={tabelaActiveCount}
              onClearAll={clearTabelaAdvanced}
            >
              <MultiSelectDropdown
                label="Tipo de receita"
                options={TIPO_RECEITA_OPTIONS}
                values={tabelaTipoSelected}
                onChange={onTabelaFilterChange(setTabelaTipoSelected)}
                placeholder="Todos os tipos"
                testIdPrefix="lancamentos-filter-tipo"
              />
              <MultiSelectDropdown
                label="Status"
                options={STATUS_OPTIONS}
                values={tabelaStatusSelected}
                onChange={onTabelaFilterChange(setTabelaStatusSelected)}
                placeholder="Todos os status"
                testIdPrefix="lancamentos-filter-status"
              />
            </AdvancedFiltersPopover>

            <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por cliente, empreiteira ou descrição..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                data-testid="input-search"
              />
            </div>
          </div>

          {tabelaActiveCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {tabelaTipoSelected.map((t) => (
                <ActiveFilterChip
                  key={t}
                  label={`Tipo: ${tipoReceitaLabels[t]}`}
                  onRemove={() => setTabelaTipoSelected(tabelaTipoSelected.filter((x) => x !== t))}
                  testId={`lancamentos-active-chip-tipo-${t}`}
                />
              ))}
              {tabelaStatusSelected.map((s) => (
                <ActiveFilterChip
                  key={s}
                  label={`Status: ${statusLabels[s]}`}
                  onRemove={() => setTabelaStatusSelected(tabelaStatusSelected.filter((x) => x !== s))}
                  testId={`lancamentos-active-chip-status-${s}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableHead className="text-xs font-bold uppercase tracking-wider">Data/Hora</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Descrição</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Cliente/Empreiteira</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Tipo de receita</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Origem</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Valor</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhum lançamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((ent: Entrada) => (
                  <TableRow
                    key={ent.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    data-testid={`row-entrada-${ent.id}`}
                  >
                    <TableCell>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatDateTime(ent.dataHora)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300 max-w-[220px] truncate">
                        {ent.descricao}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{ent.clienteEmpreiteira}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', tipoReceitaClasses[ent.tipoReceita])}
                        data-testid={`badge-tipo-${ent.id}`}
                      >
                        {tipoReceitaLabels[ent.tipoReceita]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="no-default-hover-elevate no-default-active-elevate bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                        data-testid={`badge-origem-${ent.id}`}
                      >
                        {origemLabels[ent.origem]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-sm font-bold text-[#22846D] whitespace-nowrap">
                        {formatCurrency(ent.valor)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', statusClasses[ent.status])}
                        data-testid={`badge-status-${ent.id}`}
                      >
                        {statusLabels[ent.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Exibindo{' '}
            <span className="font-bold text-gray-700 dark:text-gray-200">
              {filtered.length === 0 ? '0' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}`}
            </span>{' '}
            de{' '}
            <span className="font-bold text-gray-700 dark:text-gray-200">{filtered.length}</span>{' '}
            lançamentos
          </span>
          {totalPages > 1 && (
            <Pagination className="mx-0 w-auto justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                    aria-disabled={page === 1}
                    className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                    data-testid="entradas-pagination-prev"
                  />
                </PaginationItem>
                {getPaginationRange(page, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`entradas-ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={page === item}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(item);
                        }}
                        data-testid={`entradas-pagination-page-${item}`}
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
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                    aria-disabled={page === totalPages}
                    className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                    data-testid="entradas-pagination-next"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>

      {/* ─── BLOCO 6: Top Entidades ─── */}
      {topClientes && topEmpreiteiras && (
        <EntradaTopEntidades clientes={topClientes} empreiteiras={topEmpreiteiras} />
      )}
    </div>
  );
}
