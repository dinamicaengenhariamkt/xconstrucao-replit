'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
  RiAlertLine,
  RiMoneyDollarCircleLine,
  RiEyeLine,
  RiSearchLine,
  RiFileTextLine,
  RiTimeLine,
} from 'react-icons/ri';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@shared/components/ui/dialog';
import { cn } from '@shared/lib/utils';
import { StatsCard } from '@features/contratante/dashboard/components/StatsCard';
import { PagamentosEvolutionChart } from '@features/contratante/pagamentos/components/PagamentosEvolutionChart';
import { usePagamentos, usePagamentosKPI } from '@features/contratante/pagamentos/hooks/use-pagamentos';
import {
  PAGAMENTO_STATUS_LABELS,
  PAGAMENTO_STATUS_COLORS,
} from '@features/contratante/pagamentos/constants';
import type {
  PagamentoContratante,
} from '@features/contratante/pagamentos/types';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
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
import { formatCurrency, formatRange } from '@shared/lib/formatters';

const PAGE_SIZE = 10;

type Periodo = '7' | '30' | '60' | '90' | 'todos';
type PagamentoStatus = PagamentoContratante['status'];
type PagamentoTipo = PagamentoContratante['tipo'];

const PERIOD_OPTIONS: { value: Periodo; label: string }[] = [
  { value: '7', label: '7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '60', label: '60 dias' },
  { value: '90', label: '90 dias' },
  { value: 'todos', label: 'Todos' },
];

const TIPO_OPTIONS: { value: PagamentoTipo; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
];

const STATUS_OPTIONS: { value: PagamentoStatus; label: string }[] = (
  Object.keys(PAGAMENTO_STATUS_LABELS) as PagamentoStatus[]
).map((s) => ({ value: s, label: PAGAMENTO_STATUS_LABELS[s] }));

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export default function PagamentosPage() {
  const { data: pagamentos, isLoading: isLoadingPagamentos } = usePagamentos();
  const { data: kpi, isLoading: isLoadingKPI } = usePagamentosKPI();
  const searchParams = useSearchParams();

  // ─── Período (afeta KPIs, gráfico e tabela) ──────────────────────────────
  const [periodo, setPeriodo] = useState<Periodo>('90');

  // ─── Filtros avançados (afetam apenas a tabela) ──────────────────────────
  const [dataMin, setDataMin] = useState('');
  const [dataMax, setDataMax] = useState('');
  const [tipoSelected, setTipoSelected] = useState<PagamentoTipo[]>([]);
  const [statusSelected, setStatusSelected] = useState<PagamentoStatus[]>(() => {
    const param = searchParams?.get('status');
    if (!param) return [];
    return param
      .split(',')
      .map((s) => s.trim() as PagamentoStatus)
      .filter((s): s is PagamentoStatus => s in PAGAMENTO_STATUS_LABELS);
  });
  const [categoriaSelected, setCategoriaSelected] = useState<string[]>([]);
  const [metodoSelected, setMetodoSelected] = useState<string[]>([]);
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');

  // ─── Tabela ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ─── Estado local: pago manualmente + modal ──────────────────────────────
  const [localPaidIds, setLocalPaidIds] = useState<Set<string>>(new Set());
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedPagamento, setSelectedPagamento] = useState<PagamentoContratante | null>(null);

  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  // ─── Opções derivadas ────────────────────────────────────────────────────
  const categoriaOptions = useMemo(() => {
    const set = new Set((pagamentos ?? []).map((p) => p.categoria));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((c) => ({ value: c, label: c }));
  }, [pagamentos]);

  const metodoOptions = useMemo(() => {
    const set = new Set((pagamentos ?? []).map((p) => p.metodoPagamento));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((m) => ({ value: m, label: m }));
  }, [pagamentos]);

  // ─── Status efetivo (considerando localPaidIds) ──────────────────────────
  const effectiveStatus = (p: PagamentoContratante): PagamentoStatus =>
    localPaidIds.has(p.id) ? 'pago' : p.status;

  // ─── Filtragem por período (KPIs + chart + tabela) ───────────────────────
  const periodFiltered = useMemo(() => {
    if (!pagamentos) return [];
    if (periodo === 'todos') return pagamentos;
    const days = parseInt(periodo, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return pagamentos.filter((p) => new Date(p.data) >= cutoff);
  }, [pagamentos, periodo]);

  // ─── Filtragem da tabela (avançado + busca) ──────────────────────────────
  const tableFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return periodFiltered.filter((p) => {
      if (dataMin && p.data < dataMin) return false;
      if (dataMax && p.data > dataMax) return false;
      if (tipoSelected.length > 0 && !tipoSelected.includes(p.tipo)) return false;
      if (statusSelected.length > 0 && !statusSelected.includes(effectiveStatus(p))) return false;
      if (categoriaSelected.length > 0 && !categoriaSelected.includes(p.categoria)) return false;
      if (metodoSelected.length > 0 && !metodoSelected.includes(p.metodoPagamento)) return false;
      if (valorMinNum !== undefined && p.valor < valorMinNum) return false;
      if (valorMaxNum !== undefined && p.valor > valorMaxNum) return false;
      if (q) {
        const matches =
          p.descricao.toLowerCase().includes(q) ||
          p.obraNome.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    periodFiltered,
    dataMin,
    dataMax,
    tipoSelected,
    statusSelected,
    categoriaSelected,
    metodoSelected,
    valorMinNum,
    valorMaxNum,
    search,
    localPaidIds,
  ]);

  // ─── Pendentes (lista completa, sem filtros, para o bloco de alerta) ─────
  const pendentes = useMemo(
    () =>
      (pagamentos ?? []).filter(
        (p) => (p.status === 'pendente' || p.status === 'atrasado') && !localPaidIds.has(p.id),
      ),
    [pagamentos, localPaidIds],
  );

  // ─── KPI "A pagar" ───────────────────────────────────────────────────────
  const aPagar = useMemo(() => {
    const lista = (pagamentos ?? []).filter(
      (p) =>
        p.tipo === 'saida' &&
        (p.status === 'pendente' || p.status === 'atrasado') &&
        !localPaidIds.has(p.id),
    );
    const valor = lista.reduce((acc, p) => acc + p.valor, 0);
    const atrasados = lista.filter((p) => p.status === 'atrasado').length;
    return { valor, count: lista.length, atrasados };
  }, [pagamentos, localPaidIds]);

  const totalPages = Math.max(1, Math.ceil(tableFiltered.length / PAGE_SIZE));
  const paginated = tableFiltered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const advancedActiveCount =
    (dataMin || dataMax ? 1 : 0) +
    (tipoSelected.length > 0 ? 1 : 0) +
    (statusSelected.length > 0 ? 1 : 0) +
    (categoriaSelected.length > 0 ? 1 : 0) +
    (metodoSelected.length > 0 ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setDataMin('');
    setDataMax('');
    setTipoSelected([]);
    setStatusSelected([]);
    setCategoriaSelected([]);
    setMetodoSelected([]);
    setValorMin('');
    setValorMax('');
    setCurrentPage(1);
  };

  async function handleMarcarComoPago(id: string) {
    setLoadingId(id);
    await new Promise((r) => setTimeout(r, 600));
    setLocalPaidIds((prev) => new Set([...prev, id]));
    setLoadingId(null);
  }

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="pagamentos-contratante-page">
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div>
        <h1
          className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white"
          data-testid="text-page-title"
        >
          Pagamentos
        </h1>
        <p className="text-muted-foreground mt-1">
          Controle financeiro de todas as suas obras.
        </p>
      </div>

      {/* ─── Período (afeta KPIs + gráfico + tabela) ───────────────── */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex-wrap w-fit">
        {PERIOD_OPTIONS.map((opt) => {
          const isActive = periodo === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFilterChange(setPeriodo)(opt.value)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap',
                isActive
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm',
              )}
              data-testid={`filtro-periodo-${opt.value}`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* ─── KPIs ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoadingKPI ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))
        ) : (
          <>
            <StatsCard
              label="Entradas"
              value={formatCurrency(kpi?.totalEntradas ?? 0)}
              icon={RiArrowUpCircleLine}
              iconBgColor="bg-[#22846D]/10 text-[#22846D]"
              badge={{ label: '+12% mês', variant: 'success' }}
              luminous
            />
            <StatsCard
              label="Saídas"
              value={formatCurrency(kpi?.totalSaidas ?? 0)}
              icon={RiArrowDownCircleLine}
              iconBgColor="bg-red-50 text-red-600"
              badge={{ label: '-8% mês', variant: 'red' }}
              luminous
            />
            <StatsCard
              label="A pagar"
              value={formatCurrency(aPagar.valor)}
              icon={RiTimeLine}
              iconBgColor="bg-amber-50 text-amber-600"
              badge={
                aPagar.atrasados > 0
                  ? {
                      label: `${aPagar.atrasados} atrasado${aPagar.atrasados > 1 ? 's' : ''}`,
                      variant: 'red',
                    }
                  : aPagar.count > 0
                    ? { label: `${aPagar.count} aguardando`, variant: 'amber' }
                    : { label: 'Em dia', variant: 'success' }
              }
              href="/contratante/pagamentos?status=pendente,atrasado"
              testId="kpi-a-pagar"
              luminous
            />
            <StatsCard
              label="Total Contratado"
              value={formatCurrency(kpi?.totalContratado ?? 0)}
              icon={RiMoneyDollarCircleLine}
              iconBgColor="bg-primary/10 text-primary"
              luminous
            />
          </>
        )}
      </div>

      {/* ─── Gráfico de Evolução ───────────────────────────────────── */}
      <PagamentosEvolutionChart pagamentos={periodFiltered} luminous />

      {/* ─── Tabela de Histórico ───────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl overflow-hidden luminous-section">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Histórico de Transações
            </h3>
            <p className="text-sm text-gray-500">
              {tableFiltered.length} movimentação{tableFiltered.length === 1 ? '' : 'ões'}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <AdvancedFiltersPopover
              activeCount={advancedActiveCount}
              onClearAll={clearAllAdvanced}
            >
              <RangeDateInput
                label="Data"
                min={dataMin}
                max={dataMax}
                onMinChange={onFilterChange(setDataMin)}
                onMaxChange={onFilterChange(setDataMax)}
                testIdPrefix="filter-data"
              />
              <MultiSelectDropdown
                label="Tipo"
                options={TIPO_OPTIONS}
                values={tipoSelected}
                onChange={onFilterChange(setTipoSelected)}
                placeholder="Entradas e saídas"
                testIdPrefix="filter-tipo"
              />
              <MultiSelectDropdown
                label="Status"
                options={STATUS_OPTIONS}
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
                searchPlaceholder="Buscar categoria..."
                testIdPrefix="filter-categoria"
              />
              <MultiSelectDropdown
                label="Método de pagamento"
                options={metodoOptions}
                values={metodoSelected}
                onChange={onFilterChange(setMetodoSelected)}
                placeholder="Todos os métodos"
                testIdPrefix="filter-metodo"
              />
              <RangeNumberInput
                label="Valor"
                min={valorMin}
                max={valorMax}
                onMinChange={onFilterChange(setValorMin)}
                onMaxChange={onFilterChange(setValorMax)}
                prefix="R$ "
                placeholderMin="1.000"
                placeholderMax="500.000"
                testIdPrefix="filter-valor"
              />
            </AdvancedFiltersPopover>

            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                value={search}
                onChange={(e) => onFilterChange(setSearch)(e.target.value)}
                placeholder="Buscar transações..."
                className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                data-testid="input-search-pagamentos"
              />
            </div>
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            {(dataMin || dataMax) && (
              <ActiveFilterChip
                label={`Data: ${dataMin ? formatDate(dataMin) : '0'} – ${dataMax ? formatDate(dataMax) : '∞'}`}
                onRemove={() => {
                  onFilterChange(setDataMin)('');
                  setDataMax('');
                }}
                testId="active-chip-data"
              />
            )}
            {tipoSelected.map((t) => (
              <ActiveFilterChip
                key={t}
                label={`Tipo: ${t === 'entrada' ? 'Entrada' : 'Saída'}`}
                onRemove={() =>
                  onFilterChange(setTipoSelected)(tipoSelected.filter((x) => x !== t))
                }
                testId={`active-chip-tipo-${t}`}
              />
            ))}
            {statusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${PAGAMENTO_STATUS_LABELS[s]}`}
                onRemove={() =>
                  onFilterChange(setStatusSelected)(statusSelected.filter((x) => x !== s))
                }
                testId={`active-chip-status-${s}`}
              />
            ))}
            {categoriaSelected.map((c) => (
              <ActiveFilterChip
                key={c}
                label={`Categoria: ${c}`}
                onRemove={() =>
                  onFilterChange(setCategoriaSelected)(categoriaSelected.filter((x) => x !== c))
                }
                testId={`active-chip-categoria-${c}`}
              />
            ))}
            {metodoSelected.map((m) => (
              <ActiveFilterChip
                key={m}
                label={`Método: ${m}`}
                onRemove={() =>
                  onFilterChange(setMetodoSelected)(metodoSelected.filter((x) => x !== m))
                }
                testId={`active-chip-metodo-${m}`}
              />
            ))}
            {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Valor: ${formatRange(valorMin, valorMax, { prefix: 'R$ ' })}`}
                onRemove={() => {
                  onFilterChange(setValorMin)('');
                  setValorMax('');
                }}
                testId="active-chip-valor"
              />
            )}
          </div>
        )}

        {isLoadingPagamentos ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="pagamentos-table">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {['Data', 'Obra', 'Tipo', 'Descrição', 'Valor', 'Status', 'Ações'].map((h) => (
                      <th
                        key={h}
                        className="text-left py-4 px-4 text-xs font-bold uppercase tracking-wider text-gray-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((pag, idx) => {
                    const status = effectiveStatus(pag);
                    return (
                      <tr
                        key={pag.id}
                        onClick={() => setSelectedPagamento(pag)}
                        className={cn(
                          'border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer',
                          idx % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/20',
                        )}
                        data-testid={`pagamento-row-${pag.id}`}
                      >
                        <td className="py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                          {formatDate(pag.data)}
                        </td>
                        <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {pag.obraNome}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={cn(
                              'px-2 py-1 text-xs font-bold rounded-full',
                              pag.tipo === 'entrada'
                                ? 'bg-[#22846D]/20 text-[#22846D]'
                                : 'bg-red-100 text-red-700',
                            )}
                          >
                            {pag.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {pag.descricao}
                        </td>
                        <td
                          className={cn(
                            'py-4 px-4 text-sm font-bold',
                            pag.tipo === 'entrada' ? 'text-[#22846D]' : 'text-red-600',
                          )}
                          data-testid={`pagamento-valor-${pag.id}`}
                        >
                          {pag.tipo === 'entrada' ? '+' : '-'} {formatCurrency(pag.valor)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-1 rounded-md text-xs font-medium',
                              PAGAMENTO_STATUS_COLORS[status],
                            )}
                            data-testid={`pagamento-status-${pag.id}`}
                          >
                            {PAGAMENTO_STATUS_LABELS[status]}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPagamento(pag);
                            }}
                            className="text-gray-400 hover:text-primary transition-colors cursor-pointer"
                            title="Ver detalhes"
                            data-testid={`pagamento-detail-${pag.id}`}
                          >
                            <RiEyeLine className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {paginated.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-8 text-center text-gray-400 dark:text-gray-500"
                      >
                        Nenhum pagamento encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="mt-6">
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
                        data-testid="pagamentos-pagination-prev"
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
                            data-testid={`pagamentos-pagination-page-${item}`}
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
                        data-testid="pagamentos-pagination-next"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Pagamentos pendentes ou atrasados ─────────────────────── */}
      {pendentes.length > 0 && (
        <div
          className="bg-amber-50 dark:bg-amber-900/10 border-l-4 border-l-amber-500 p-6 rounded-xl"
          data-testid="bloco-pendentes"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
              <RiAlertLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-800 dark:text-amber-300">
                Pagamentos pendentes ou atrasados
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Você tem {pendentes.length} pagamento{pendentes.length > 1 ? 's' : ''} aguardando
                confirmação · clique para abrir a obra.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {pendentes.map((pag) => {
              const isAtrasado = pag.status === 'atrasado';
              return (
                <div
                  key={pag.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-gray-900 p-4 rounded-lg border border-amber-200 dark:border-amber-900/30"
                >
                  <Link
                    href={`/contratante/minhas-obras/${pag.obraId}`}
                    className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                    data-testid={`pendente-link-${pag.id}`}
                  >
                    <div
                      className={cn(
                        'p-2 rounded-lg flex-shrink-0',
                        isAtrasado
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
                      )}
                    >
                      <RiFileTextLine className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                        {pag.obraNome} — {pag.descricao}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isAtrasado ? 'Vencido em' : 'Vencimento em'} {formatDate(pag.data)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <p
                      className={cn(
                        'text-lg font-extrabold',
                        isAtrasado ? 'text-red-600' : 'text-gray-900 dark:text-gray-100',
                      )}
                    >
                      {formatCurrency(pag.valor)}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleMarcarComoPago(pag.id)}
                      disabled={loadingId === pag.id}
                      className={cn(
                        'text-xs font-bold whitespace-nowrap',
                        isAtrasado
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white',
                      )}
                      data-testid={`pendente-marcar-pago-${pag.id}`}
                    >
                      {loadingId === pag.id ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Salvando...
                        </>
                      ) : (
                        'Marcar como pago'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Modal de detalhes ─────────────────────────────────────── */}
      <Dialog
        open={!!selectedPagamento}
        onOpenChange={(open) => {
          if (!open) setSelectedPagamento(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre a transação selecionada.
            </DialogDescription>
          </DialogHeader>

          {selectedPagamento && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-2">
              {[
                { label: 'Obra', value: selectedPagamento.obraNome },
                { label: 'Data', value: formatDate(selectedPagamento.data) },
                { label: 'Descrição', value: selectedPagamento.descricao, full: true },
                { label: 'Categoria', value: selectedPagamento.categoria },
                { label: 'Método de Pagamento', value: selectedPagamento.metodoPagamento },
                {
                  label: 'Valor',
                  value: `${selectedPagamento.tipo === 'entrada' ? '+' : '-'} ${formatCurrency(selectedPagamento.valor)}`,
                },
              ].map(({ label, value, full }) => (
                <div key={label} className={full ? 'col-span-2' : ''}>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {value}
                  </p>
                </div>
              ))}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Tipo
                </p>
                <span
                  className={cn(
                    'inline-block px-2.5 py-1 rounded-full text-xs font-bold',
                    selectedPagamento.tipo === 'entrada'
                      ? 'bg-[#22846D]/20 text-[#22846D]'
                      : 'bg-red-100 text-red-700',
                  )}
                >
                  {selectedPagamento.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Status
                </p>
                <span
                  className={cn(
                    'inline-block px-2.5 py-1 rounded-md text-xs font-medium',
                    PAGAMENTO_STATUS_COLORS[effectiveStatus(selectedPagamento)],
                  )}
                >
                  {PAGAMENTO_STATUS_LABELS[effectiveStatus(selectedPagamento)]}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            {selectedPagamento && (
              <Button asChild variant="outline">
                <Link
                  href={`/contratante/minhas-obras/${selectedPagamento.obraId}`}
                  data-testid="modal-ir-para-obra"
                >
                  Ir para a obra
                </Link>
              </Button>
            )}
            <Button onClick={() => setSelectedPagamento(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
