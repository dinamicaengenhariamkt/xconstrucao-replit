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
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';

// ─── Formatting ───────────────────────────────────────────────────────────────

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

// ─── Label / Style Maps ───────────────────────────────────────────────────────

const tipoReceitaLabels: Record<EntradaTipoReceita, string> = {
  taxa_medicao: 'Taxa sobre medição',
  assinatura: 'Assinatura',
  outros_servicos: 'Outros serviços',
};

const tipoReceitaClasses: Record<EntradaTipoReceita, string> = {
  taxa_medicao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  assinatura: 'bg-[#22846D]/10 text-[#22846D]',
  outros_servicos: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const origemLabels: Record<EntradaOrigem, string> = {
  cliente: 'Cliente',
  empreiteira: 'Empreiteira',
  outros: 'Outros',
};

const statusLabels: Record<EntradaStatus, string> = {
  recebido: 'Recebido',
  pendente: 'Pendente',
  em_processamento: 'Em processamento',
};

const statusClasses: Record<EntradaStatus, string> = {
  recebido: 'bg-[#22846D]/10 text-[#22846D]',
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  em_processamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const ORIGEM_OPTIONS: { value: EntradaOrigem; label: string }[] = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'empreiteira', label: 'Empreiteira' },
  { value: 'outros', label: 'Outros' },
];

const TIPO_RECEITA_OPTIONS: { value: EntradaTipoReceita; label: string }[] = [
  { value: 'taxa_medicao', label: 'Taxa sobre medição' },
  { value: 'assinatura', label: 'Assinatura' },
  { value: 'outros_servicos', label: 'Outros serviços' },
];

const STATUS_OPTIONS: { value: EntradaStatus; label: string }[] = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_processamento', label: 'Em processamento' },
];

// ─── Period options ───────────────────────────────────────────────────────────

const periodOptions: { value: EntradaPeriodo; label: string }[] = [
  { value: '7dias', label: '7 dias' },
  { value: '30dias', label: 'Últimos 30 dias' },
  { value: '3meses', label: '3 meses' },
  { value: '12meses', label: '12 meses' },
  { value: 'personalizado', label: 'Personalizado' },
];

const PAGE_SIZE = 20;

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
        badge: {
          label: `+${kpi.crescimentoPercent.toFixed(1).replace('.', ',')}% vs. anterior`,
          variant: 'success' as const,
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
            {periodOptions.map((opt) => {
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
            <StatsCard {...kpiCard} />
          </motion.div>
        ))}
      </motion.div>

      {/* ─── BLOCO 4: Gráfico ─── */}
      <EntradaChart data={chartData?.chart} insights={chartData?.insights} />

      {/* ─── BLOCO 5: Tabela de Lançamentos ─── */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors',
                      page === pageNum
                        ? 'bg-primary text-white font-bold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 dark:text-gray-300 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
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
