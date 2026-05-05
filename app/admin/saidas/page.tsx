'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  RiArrowDownLine,
  RiBuildingLine,
  RiMoneyDollarCircleLine,
  RiFileChartLine,
  RiTimeLine,
  RiArrowUpLine,
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
import { SaidaChart } from '@features/admin/saidas/components/SaidaChart';
import { SaidaTopEntidades } from '@features/admin/saidas/components/SaidaTopEntidades';
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
  SaidaPeriodo,
  SaidaTipo,
  SaidaStatus,
  SaidaDestinoPerfil,
  Saida,
  SaidaFutura,
  DateRange,
} from '@features/admin/saidas/types';
import {
  useSaidaKpi,
  useSaidas,
  useSaidaChart,
  useSaidasFuturas,
  useTopEmpreiteirasPagas,
  useTopClientesReembolsados,
} from '@features/admin/saidas/hooks/use-saidas';
import { formatCurrencyRounded as formatCurrency, formatDateTime, formatDate } from '@shared/lib/formatters';
import {
  tipoSaidaLabels,
  tipoSaidaClasses,
  statusLabels,
  statusClasses,
  destinoPerfilLabels,
  destinoPerfilClasses,
  TIPO_SAIDA_OPTIONS,
  DESTINO_PERFIL_OPTIONS,
  STATUS_OPTIONS,
  SEM_OBRA,
  PERIOD_OPTIONS,
  PAGE_SIZE,
  PAGE_SIZE_FUTURAS,
} from '@features/admin/saidas/constants';

function formatRangeLabel(range: DateRange | undefined): string {
  if (!range) return 'Personalizado';
  const from = format(range.from, 'dd/MM', { locale: ptBR });
  const to = range.to ? format(range.to, 'dd/MM', { locale: ptBR }) : '...';
  return `${from} – ${to}`;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SaidasSkeleton() {
  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-9 w-32" />
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
      <Card>
        <CardContent className="p-0">
          <Skeleton className="h-48 w-full rounded-xl" />
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

export default function AdminSaidasPage() {
  const [periodo, setPeriodo] = useState<SaidaPeriodo>('30dias');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Filtros globais (afetam tabela de lançamentos)
  const [tipoSaidaSelected, setTipoSaidaSelected] = useState<SaidaTipo[]>([]);
  const [destinoPerfilSelected, setDestinoPerfilSelected] = useState<SaidaDestinoPerfil[]>([]);

  // Filtros da tabela
  const [tabelaTipoSelected, setTabelaTipoSelected] = useState<SaidaTipo[]>([]);
  const [tabelaStatusSelected, setTabelaStatusSelected] = useState<SaidaStatus[]>([]);
  const [tabelaObraSelected, setTabelaObraSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [futurasPage, setFuturasPage] = useState(1);

  function handleDayPickerSelect(range: DayPickerRange | undefined) {
    if (!range?.from) { setCustomRange(undefined); return; }
    setCustomRange({ from: range.from, to: range.to });
    if (range.from && range.to) setPopoverOpen(false);
  }

  function handlePeriodoChange(p: SaidaPeriodo) {
    if (p !== 'personalizado') setCustomRange(undefined);
    setPeriodo(p);
    setPage(1);
    if (p === 'personalizado') setPopoverOpen(true);
  }

  const topoActiveCount =
    (tipoSaidaSelected.length > 0 ? 1 : 0) + (destinoPerfilSelected.length > 0 ? 1 : 0);

  const clearTopoFilters = () => {
    setTipoSaidaSelected([]);
    setDestinoPerfilSelected([]);
    setPage(1);
  };

  const onTopoFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  const { data: kpi, isLoading: isLoadingKpi } = useSaidaKpi(periodo);
  const { data: saidas, isLoading: isLoadingSaidas } = useSaidas(periodo, customRange);
  const { data: chartData, isLoading: isLoadingChart } = useSaidaChart(periodo);
  const { data: futuras, isLoading: isLoadingFuturas } = useSaidasFuturas();
  const { data: topEmpreiteirasPagas, isLoading: isLoadingTopEmp } = useTopEmpreiteirasPagas(periodo);
  const { data: topClientesReembolsados, isLoading: isLoadingTopCli } = useTopClientesReembolsados(periodo);

  const isLoading =
    isLoadingKpi ||
    isLoadingSaidas ||
    isLoadingChart ||
    isLoadingFuturas ||
    isLoadingTopEmp ||
    isLoadingTopCli;

  const obraOptions = useMemo(() => {
    const set = new Set<string>();
    (saidas ?? []).forEach((s) => { if (s.obra) set.add(s.obra); });
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return [
      { value: SEM_OBRA, label: 'Sem obra vinculada' },
      ...sorted.map((o) => ({ value: o, label: o })),
    ];
  }, [saidas]);

  const filtered = useMemo(() => {
    let result = saidas ?? [];
    if (tipoSaidaSelected.length > 0) {
      result = result.filter((s) => tipoSaidaSelected.includes(s.tipoSaida));
    }
    if (destinoPerfilSelected.length > 0) {
      result = result.filter((s) => destinoPerfilSelected.includes(s.destinoPerfil));
    }
    if (tabelaTipoSelected.length > 0) {
      result = result.filter((s) => tabelaTipoSelected.includes(s.tipoSaida));
    }
    if (tabelaStatusSelected.length > 0) {
      result = result.filter((s) => tabelaStatusSelected.includes(s.status));
    }
    if (tabelaObraSelected.length > 0) {
      result = result.filter((s) => {
        if (s.obra) return tabelaObraSelected.includes(s.obra);
        return tabelaObraSelected.includes(SEM_OBRA);
      });
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.descricao.toLowerCase().includes(q) ||
          s.destino.toLowerCase().includes(q) ||
          (s.obra && s.obra.toLowerCase().includes(q))
      );
    }
    return result;
  }, [saidas, tipoSaidaSelected, destinoPerfilSelected, tabelaTipoSelected, tabelaStatusSelected, tabelaObraSelected, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const futurasTotal = futuras?.length ?? 0;
  const futurasTotalPages = Math.max(1, Math.ceil(futurasTotal / PAGE_SIZE_FUTURAS));
  const futurasPaginated = (futuras ?? []).slice(
    (futurasPage - 1) * PAGE_SIZE_FUTURAS,
    futurasPage * PAGE_SIZE_FUTURAS
  );

  const tabelaActiveCount =
    (tabelaTipoSelected.length > 0 ? 1 : 0) +
    (tabelaStatusSelected.length > 0 ? 1 : 0) +
    (tabelaObraSelected.length > 0 ? 1 : 0);

  const clearTabelaAdvanced = () => {
    setTabelaTipoSelected([]);
    setTabelaStatusSelected([]);
    setTabelaObraSelected([]);
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
        label: 'Total de saídas',
        value: formatCurrency(kpi.totalSaidas),
        icon: RiArrowDownLine,
        iconBgColor: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        badge: {
          label: `+${kpi.crescimentoPercent.toFixed(1).replace('.', ',')}% vs. anterior`,
          variant: 'error' as const,
        },
      },
      {
        label: 'Pagamentos a empreiteiras',
        value: formatCurrency(kpi.pagamentosEmpreiteiras),
        icon: RiBuildingLine,
        iconBgColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: {
          label: `${kpi.pagamentosEmpreiteirasPercent.toFixed(1).replace('.', ',')}% das saídas`,
          variant: 'info' as const,
        },
      },
      {
        label: 'Reembolsos a clientes',
        value: formatCurrency(kpi.reembolsos),
        icon: RiMoneyDollarCircleLine,
        iconBgColor: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        badge: {
          label: `${kpi.reembolsosPercent.toFixed(1).replace('.', ',')}% das saídas`,
          variant: 'warning' as const,
        },
      },
      {
        label: 'Outros desembolsos',
        value: formatCurrency(kpi.outrosDesembolsos),
        icon: RiFileChartLine,
        iconBgColor: 'bg-primary/10 text-primary',
        badge: {
          label: `${kpi.outrosDesembolsosPercent.toFixed(1).replace('.', ',')}% das saídas`,
          variant: 'primary' as const,
        },
      },
      {
        label: 'Saídas previstas',
        value: formatCurrency(kpi.saidasPrevistas),
        icon: RiTimeLine,
        iconBgColor: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        badge: { label: 'Compromissos futuros', variant: 'info' as const },
      },
      {
        label: 'Maior pagamento no período',
        value: formatCurrency(kpi.maiorPagamento),
        icon: RiArrowUpLine,
        iconBgColor: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        badge: { label: kpi.maiorPagamentoDescricao, variant: 'error' as const },
      },
    ];
  }, [kpi]);

  if (isLoading) return <SaidasSkeleton />;

  return (
    <div className="p-6 md:p-10 space-y-8">
      {/* ─── BLOCO 1: Header ─── */}
      <div>
        {kpi && (
          <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">
            As saídas cresceram {kpi.crescimentoPercent.toFixed(1).replace('.', ',')}% em relação aos 30 dias anteriores
          </p>
        )}
        <h1
          className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight"
          data-testid="text-page-title"
        >
          Saídas
        </h1>
        <p className="text-muted-foreground mt-1">
          Detalhamento dos pagamentos e desembolsos da plataforma por período, destino e tipo.
        </p>
      </div>

      {/* ─── BLOCO 2: Filtros globais (escopo: KPIs + gráfico + lançamentos) ─── */}
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/40 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Filtros globais
            </p>
            <p className="text-xs text-muted-foreground">
              Período aplicado aos KPIs, gráfico e lançamentos · Tipo de saída e destino refinam a tabela de lançamentos
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
                label="Tipo de saída"
                options={TIPO_SAIDA_OPTIONS}
                values={tipoSaidaSelected}
                onChange={onTopoFilterChange(setTipoSaidaSelected)}
                placeholder="Todos os tipos"
                testIdPrefix="topo-filter-tipo"
              />
              <MultiSelectDropdown
                label="Destino"
                options={DESTINO_PERFIL_OPTIONS}
                values={destinoPerfilSelected}
                onChange={onTopoFilterChange(setDestinoPerfilSelected)}
                placeholder="Todos os destinos"
                testIdPrefix="topo-filter-destino"
              />
            </AdvancedFiltersPopover>
          </div>
        </div>

        {topoActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {tipoSaidaSelected.map((t) => (
              <ActiveFilterChip
                key={t}
                label={`Tipo: ${tipoSaidaLabels[t]}`}
                onRemove={() => setTipoSaidaSelected(tipoSaidaSelected.filter((x) => x !== t))}
                testId={`topo-active-chip-tipo-${t}`}
              />
            ))}
            {destinoPerfilSelected.map((d) => (
              <ActiveFilterChip
                key={d}
                label={`Destino: ${destinoPerfilLabels[d]}`}
                onRemove={() => setDestinoPerfilSelected(destinoPerfilSelected.filter((x) => x !== d))}
                testId={`topo-active-chip-destino-${d}`}
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
      <SaidaChart data={chartData?.chart} insights={chartData?.insights} luminous />

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
                label="Tipo de saída"
                options={TIPO_SAIDA_OPTIONS}
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
              <MultiSelectDropdown
                label="Obra"
                options={obraOptions}
                values={tabelaObraSelected}
                onChange={onTabelaFilterChange(setTabelaObraSelected)}
                placeholder="Todas as obras"
                testIdPrefix="lancamentos-filter-obra"
              />
            </AdvancedFiltersPopover>

            <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por empreiteira, cliente, obra ou descrição..."
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
                  label={`Tipo: ${tipoSaidaLabels[t]}`}
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
              {tabelaObraSelected.map((o) => (
                <ActiveFilterChip
                  key={o}
                  label={`Obra: ${o === SEM_OBRA ? 'Sem obra' : o}`}
                  onRemove={() => setTabelaObraSelected(tabelaObraSelected.filter((x) => x !== o))}
                  testId={`lancamentos-active-chip-obra-${o}`}
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
                <TableHead className="text-xs font-bold uppercase tracking-wider">Descrição da saída</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Obra/Contexto</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Destino</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Tipo de saída</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-right">Valor</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    Nenhuma saída encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((sai: Saida) => (
                  <TableRow
                    key={sai.id}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    data-testid={`row-saida-${sai.id}`}
                  >
                    <TableCell>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatDateTime(sai.dataHora)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300 max-w-[220px] truncate">
                        {sai.descricao}
                      </p>
                    </TableCell>
                    <TableCell>
                      {sai.obra ? (
                        <>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{sai.obra}</p>
                          {sai.local && (
                            <p className="text-xs text-gray-400">{sai.local}</p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">Não vinculado a obra</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{sai.destino}</p>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'no-default-hover-elevate no-default-active-elevate mt-0.5 text-[10px]',
                          destinoPerfilClasses[sai.destinoPerfil]
                        )}
                        data-testid={`badge-destino-${sai.id}`}
                      >
                        {destinoPerfilLabels[sai.destinoPerfil]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', tipoSaidaClasses[sai.tipoSaida])}
                        data-testid={`badge-tipo-${sai.id}`}
                      >
                        {tipoSaidaLabels[sai.tipoSaida]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-sm font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                        {formatCurrency(sai.valor)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn('no-default-hover-elevate no-default-active-elevate', statusClasses[sai.status])}
                        data-testid={`badge-status-${sai.id}`}
                      >
                        {statusLabels[sai.status]}
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
            saídas
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
                    data-testid="saidas-pagination-prev"
                  />
                </PaginationItem>
                {getPaginationRange(page, totalPages).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <PaginationItem key={`saidas-ellipsis-${idx}`}>
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
                        data-testid={`saidas-pagination-page-${item}`}
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
                    data-testid="saidas-pagination-next"
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>

      {/* ─── BLOCO 6: Agenda de saídas futuras ─── */}
      {futuras && futuras.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">Saídas previstas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Compromissos de pagamento nos próximos 30 dias</p>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {futurasPaginated.map((fut: SaidaFutura) => (
              <div
                key={fut.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                data-testid={`row-futura-${fut.id}`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400">
                    <span className="text-xs font-bold leading-none">{formatDate(fut.vencimento, { style: 'short' }).split('/')[0]}</span>
                    <span className="text-[10px] font-medium leading-none mt-0.5">/{formatDate(fut.vencimento, { style: 'short' }).split('/')[1]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{fut.descricao}</p>
                    {fut.obra && (
                      <p className="text-xs text-gray-400 truncate">{fut.obra}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{fut.destino}</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'no-default-hover-elevate no-default-active-elevate text-[10px]',
                        destinoPerfilClasses[fut.destinoPerfil]
                      )}
                    >
                      {destinoPerfilLabels[fut.destinoPerfil]}
                    </Badge>
                  </div>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                    {formatCurrency(fut.valor)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Exibindo{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">
                {futurasTotal === 0 ? '0' : `${(futurasPage - 1) * PAGE_SIZE_FUTURAS + 1}–${Math.min(futurasPage * PAGE_SIZE_FUTURAS, futurasTotal)}`}
              </span>{' '}
              de{' '}
              <span className="font-bold text-gray-700 dark:text-gray-200">{futurasTotal}</span>{' '}
              compromissos
            </span>
            {futurasTotalPages > 1 && (
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setFuturasPage((p) => Math.max(1, p - 1));
                      }}
                      aria-disabled={futurasPage === 1}
                      className={futurasPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      data-testid="futuras-prev-page"
                    />
                  </PaginationItem>
                  {getPaginationRange(futurasPage, futurasTotalPages).map((item, idx) =>
                    item === 'ellipsis' ? (
                      <PaginationItem key={`futuras-ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={futurasPage === item}
                          onClick={(e) => {
                            e.preventDefault();
                            setFuturasPage(item);
                          }}
                          data-testid={`futuras-page-${item}`}
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
                        setFuturasPage((p) => Math.min(futurasTotalPages, p + 1));
                      }}
                      aria-disabled={futurasPage === futurasTotalPages}
                      className={futurasPage === futurasTotalPages ? 'pointer-events-none opacity-50' : ''}
                      data-testid="futuras-next-page"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      )}

      {/* ─── BLOCO 7: Top Entidades ─── */}
      {topEmpreiteirasPagas && topClientesReembolsados && (
        <SaidaTopEntidades
          empreiteiras={topEmpreiteirasPagas}
          clientes={topClientesReembolsados}
        />
      )}
    </div>
  );
}
