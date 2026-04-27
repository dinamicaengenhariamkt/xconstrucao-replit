'use client';

import { useMemo, useState } from 'react';
import { cn } from '@shared/lib/utils';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Input } from '@shared/components/ui/input';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import {
  RiDownload2Line,
  RiLineChartLine,
  RiSearchLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import type { ClienteFinanceiro, ClientePagamento, PagamentoStatus } from '../types';
import { formatCurrency } from '@shared/lib/formatters';

const PAGAMENTO_STATUS_CONFIG: Record<PagamentoStatus, { label: string; className: string }> = {
  pago: {
    label: 'Pago',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  pendente: {
    label: 'Pendente',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  atrasado: {
    label: 'Atrasado',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
};

const STATUS_OPTIONS = (Object.keys(PAGAMENTO_STATUS_CONFIG) as PagamentoStatus[]).map((s) => ({
  value: s,
  label: PAGAMENTO_STATUS_CONFIG[s].label,
}));

const PAGE_SIZE = 10;

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('pt-BR');

function buildChartData(pagamentos: ClientePagamento[]) {
  const map: Record<string, { mes: string; recebido: number; aReceber: number }> = {};
  for (const p of pagamentos) {
    const date = new Date(p.data);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    if (!map[key]) map[key] = { mes: label, recebido: 0, aReceber: 0 };
    if (p.status === 'pago') map[key].recebido += p.valor;
    else map[key].aReceber += p.valor;
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}

interface ClienteFinanceiroTabProps {
  financeiro: ClienteFinanceiro | null | undefined;
  isLoading: boolean;
}

export function ClienteFinanceiroTab({ financeiro, isLoading }: ClienteFinanceiroTabProps) {
  const [statusSelected, setStatusSelected] = useState<PagamentoStatus[]>([]);
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const pagamentos = financeiro?.pagamentos ?? [];

  const filtered = useMemo(() => {
    let result = pagamentos;
    if (statusSelected.length > 0) {
      result = result.filter((p) => statusSelected.includes(p.status));
    }
    if (valorMinNum !== undefined) {
      result = result.filter((p) => p.valor >= valorMinNum);
    }
    if (valorMaxNum !== undefined) {
      result = result.filter((p) => p.valor <= valorMaxNum);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.descricao.toLowerCase().includes(q));
    }
    return result;
  }, [pagamentos, statusSelected, valorMinNum, valorMaxNum, search]);

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setValorMin('');
    setValorMax('');
    setPage(1);
  };

  const formatRange = (min: string, max: string, prefix = '') => {
    const minPart = min ? `${prefix}${min}` : `${prefix}0`;
    const maxPart = max ? `${prefix}${max}` : '∞';
    return `${minPart} – ${maxPart}`;
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const isFiltering = advancedActiveCount > 0 || search.trim().length > 0;

  function handleDownloadComprovante(pagamento: ClientePagamento) {
    import('jspdf').then(({ default: jsPDF }) => {
      const doc = new jsPDF({ unit: 'mm', format: 'a5' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('COMPROVANTE DE PAGAMENTO', 74, 20, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`ID: ${pagamento.id}`,                       14, 38);
      doc.text(`Data: ${formatDate(pagamento.data)}`,       14, 46);
      doc.text(`Descrição: ${pagamento.descricao}`,         14, 54);
      doc.text(`Valor: ${formatCurrency(pagamento.valor)}`, 14, 62);
      doc.text(`Status: Pago`,                              14, 70);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Gerado em ${new Date().toLocaleDateString('pt-BR')}`,
        74, 130, { align: 'center' },
      );
      doc.save(`comprovante-${pagamento.id}.pdf`);
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!financeiro) {
    return (
      <div className="text-center py-12">
        <RiLineChartLine className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sem dados financeiros</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground font-medium">Total Pago</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 tabular-nums">
            {formatCurrency(financeiro.totalPago)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground font-medium">Saldo Pendente</p>
          <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-2 tabular-nums">
            {formatCurrency(financeiro.saldoPendente)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
          <p className="text-sm text-muted-foreground font-medium">Próximo Vencimento</p>
          {financeiro.proximoVencimento ? (
            <>
              <p className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2 tabular-nums">
                {formatDate(financeiro.proximoVencimento)}
              </p>
              {financeiro.valorProximoVencimento && (
                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                  {formatCurrency(financeiro.valorProximoVencimento)}
                </p>
              )}
            </>
          ) : (
            <p className="text-2xl font-extrabold text-gray-400 dark:text-gray-500 mt-2">—</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
          Entradas vs A Receber
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={buildChartData(financeiro.pagamentos)} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="mes" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="recebido" name="Recebido"  fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="aReceber" name="A receber" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Payment history */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-gray-900 dark:text-white">Histórico de Pagamentos</h3>

        {/* Toolbar */}
        {pagamentos.length > 0 && (
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
                  onChange={(next) => {
                    setStatusSelected(next);
                    setPage(1);
                  }}
                  placeholder="Todos os status"
                  testIdPrefix="pagamento-filter-status"
                />
                <RangeNumberInput
                  label="Valor"
                  min={valorMin}
                  max={valorMax}
                  onMinChange={(v) => {
                    setValorMin(v);
                    setPage(1);
                  }}
                  onMaxChange={(v) => {
                    setValorMax(v);
                    setPage(1);
                  }}
                  prefix="R$ "
                  placeholderMin="50.000"
                  placeholderMax="500.000"
                  testIdPrefix="pagamento-filter-valor"
                />
              </AdvancedFiltersPopover>

              <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por descrição..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  data-testid="pagamento-search"
                />
              </div>
            </div>

            {advancedActiveCount > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {statusSelected.map((s) => (
                  <ActiveFilterChip
                    key={s}
                    label={`Status: ${PAGAMENTO_STATUS_CONFIG[s].label}`}
                    onRemove={() => setStatusSelected(statusSelected.filter((x) => x !== s))}
                    testId={`pagamento-active-chip-status-${s}`}
                  />
                ))}
                {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
                  <ActiveFilterChip
                    label={`Valor: ${formatRange(valorMin, valorMax, 'R$ ')}`}
                    onRemove={() => {
                      setValorMin('');
                      setValorMax('');
                    }}
                    testId="pagamento-active-chip-valor"
                  />
                )}
              </div>
            )}

            {isFiltering && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{filtered.length}</span> resultado{filtered.length === 1 ? '' : 's'} de {pagamentos.length} pagamento{pagamentos.length === 1 ? '' : 's'}
              </p>
            )}
          </div>
        )}

        {/* Empty states */}
        {pagamentos.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sem pagamentos registrados.</p>
          </div>
        )}

        {pagamentos.length > 0 && filtered.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhum pagamento corresponde aos filtros.</p>
            <button
              type="button"
              onClick={() => {
                clearAllAdvanced();
                setSearch('');
              }}
              className="mt-2 text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              Limpar filtros
            </button>
          </div>
        )}

        {/* Table */}
        {filtered.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Data</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Descrição</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Valor</th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Comprovante</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((pagamento, index) => {
                    const statusCfg = PAGAMENTO_STATUS_CONFIG[pagamento.status];
                    return (
                      <tr
                        key={pagamento.id}
                        className={cn(
                          'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                          index < paginated.length - 1 && 'border-b border-gray-50 dark:border-gray-800/60',
                        )}
                      >
                        <td className="py-4 px-4 text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                          {formatDate(pagamento.data)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-900 dark:text-white">{pagamento.descricao}</td>
                        <td className="py-4 px-4 text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                          {formatCurrency(pagamento.valor)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-bold', statusCfg.className)}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {pagamento.status === 'pago' ? (
                            <button
                              onClick={() => handleDownloadComprovante(pagamento)}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                              title="Baixar comprovante"
                            >
                              <RiDownload2Line className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-muted-foreground tabular-nums">
                  Mostrando {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors',
                      safePage === 1
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                        : 'cursor-pointer bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                    )}
                    data-testid="pagamento-pagination-prev"
                  >
                    <RiArrowLeftSLine className="w-4 h-4" />
                    Anterior
                  </button>
                  <span className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors',
                      safePage === totalPages
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                        : 'cursor-pointer bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                    )}
                    data-testid="pagamento-pagination-next"
                  >
                    Próxima
                    <RiArrowRightSLine className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
