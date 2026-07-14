'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { LuminousHoverCard } from '@shared/components/ui/LuminousHoverCard';
import { Input } from '@shared/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@shared/components/ui/tabs';
import {
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiArrowLeftSLine,
  RiArrowDownSLine,
  RiBuilding2Line,
  RiMapPinLine,
  RiCalendarLine,
  RiUserLine,
  RiHammerLine,
  RiMoneyDollarCircleLine,
  RiCheckboxCircleLine,
  RiWalletLine,
  RiBarChartLine,
  RiTimeLine,
  RiAlertLine,
  RiBankCardLine,
  RiFileListLine,
  RiInformationLine,
  RiAddCircleLine,
  RiStickyNoteLine,
  RiSearchLine,
} from 'react-icons/ri';
import { useAdminObraDetalhe } from '@features/admin/obras/hooks/use-admin-obra-detalhe';
import { EtapasJ06Card } from '@features/obras/medicoes/components/EtapasJ06Card';
import { DiarioJ06Card } from '@features/obras/medicoes/components/DiarioJ06Card';
import { OcorrenciasJ06Card } from '@features/obras/medicoes/components/OcorrenciasJ06Card';
import { FotosJ06Card } from '@features/obras/medicoes/components/FotosJ06Card';
import { useAuthStore } from '@features/auth/store/auth-store';
import { VISIBILIDADE_LABEL_MAP } from '@features/admin/obras/api/admin-obra-detalhe-service';
import type { AdminObraMedicao, AdminObraHistoricoItem, ObraMedicaoStatus } from '@features/admin/obras/types';
import { formatCurrencyRounded as formatCurrency } from '@shared/lib/formatters';
import { HealthCard, HealthDetailPanel, useObraHealth } from '@features/shared/health';
import { RiHeartPulseLine } from 'react-icons/ri';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import { RangeDateInput } from '@features/shared/components/filters/RangeDateInput';

type ObraStatus = 'em_andamento' | 'concluida' | 'pausada' | 'cancelada';

const STATUS_CONFIG: Record<ObraStatus, { label: string; className: string }> = {
  em_andamento: {
    label: 'Em andamento',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  concluida: {
    label: 'Concluída',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  },
  pausada: {
    label: 'Pausada',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  cancelada: {
    label: 'Cancelada',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
};

const MEDICAO_STATUS_CONFIG: Record<ObraMedicaoStatus, { label: string; className: string }> = {
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
  em_analise: {
    label: 'Em análise',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  aprovada_contratante: {
    label: 'Aprovada pelo contratante',
    className: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  },
  rejeitada_contratante: {
    label: 'Rejeitada pelo contratante',
    className: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  },
  em_disputa: {
    label: 'Em disputa',
    className: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  },
};

const HISTORICO_ICON: Record<AdminObraHistoricoItem['tipo'], React.ComponentType<{ className?: string }>> = {
  pagamento: RiBankCardLine,
  medicao: RiFileListLine,
  aditivo: RiAddCircleLine,
  alerta: RiAlertLine,
  nota: RiStickyNoteLine,
};

const HISTORICO_COLOR: Record<AdminObraHistoricoItem['tipo'], string> = {
  pagamento: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  medicao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  aditivo: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  alerta: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  nota: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-10 text-right">
        {percent}%
      </span>
    </div>
  );
}

const MEDICOES_PAGE_SIZE = 10;
const HISTORICO_INITIAL_VISIBLE = 5;
const HISTORICO_LOAD_INCREMENT = 5;

const MEDICAO_STATUS_OPTIONS = (Object.keys(MEDICAO_STATUS_CONFIG) as ObraMedicaoStatus[]).map(
  (s) => ({ value: s, label: MEDICAO_STATUS_CONFIG[s].label })
);

/** Converte 'DD/MM/YYYY' em Date local. Retorna null se inválido. */
function parseBRDate(str: string | undefined | null): Date | null {
  if (!str) return null;
  const parts = str.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return null;
  return new Date(year, month - 1, day);
}

function MedicoesTab({ medicoes }: { medicoes: AdminObraMedicao[] }) {
  const [statusSelected, setStatusSelected] = useState<ObraMedicaoStatus[]>([]);
  const [vencMin, setVencMin] = useState('');
  const [vencMax, setVencMax] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);
  const vencMinDate = vencMin ? new Date(`${vencMin}T00:00:00`) : null;
  const vencMaxDate = vencMax ? new Date(`${vencMax}T23:59:59`) : null;

  const filtered = useMemo(() => {
    let result = medicoes;
    if (statusSelected.length > 0) {
      result = result.filter((m) => statusSelected.includes(m.status));
    }
    if (vencMinDate || vencMaxDate) {
      result = result.filter((m) => {
        const venc = parseBRDate(m.dataVencimento);
        if (!venc) return false;
        if (vencMinDate && venc < vencMinDate) return false;
        if (vencMaxDate && venc > vencMaxDate) return false;
        return true;
      });
    }
    if (valorMinNum !== undefined) {
      result = result.filter((m) => m.valorMedicao >= valorMinNum);
    }
    if (valorMaxNum !== undefined) {
      result = result.filter((m) => m.valorMedicao <= valorMaxNum);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.periodo.toLowerCase().includes(q) ||
          String(m.numero).includes(q),
      );
    }
    return result;
  }, [medicoes, statusSelected, vencMinDate, vencMaxDate, valorMinNum, valorMaxNum, search]);

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (vencMin || vencMax ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setVencMin('');
    setVencMax('');
    setValorMin('');
    setValorMax('');
    setPage(1);
  };

  const formatBRDateRange = (min: string, max: string) => {
    const fmt = (iso: string) => {
      if (!iso) return null;
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    };
    const minPart = fmt(min) ?? '–';
    const maxPart = fmt(max) ?? '–';
    return `${minPart} a ${maxPart}`;
  };

  const formatValorRange = (min: string, max: string) => {
    const minPart = min ? `R$ ${min}` : 'R$ 0';
    const maxPart = max ? `R$ ${max}` : '∞';
    return `${minPart} – ${maxPart}`;
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / MEDICOES_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * MEDICOES_PAGE_SIZE, safePage * MEDICOES_PAGE_SIZE);
  const isFiltering = advancedActiveCount > 0 || search.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {medicoes.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AdvancedFiltersPopover
              activeCount={advancedActiveCount}
              onClearAll={clearAllAdvanced}
            >
              <MultiSelectDropdown
                label="Status"
                options={MEDICAO_STATUS_OPTIONS}
                values={statusSelected}
                onChange={(next) => {
                  setStatusSelected(next);
                  setPage(1);
                }}
                placeholder="Todos os status"
                testIdPrefix="medicoes-filter-status"
              />
              <RangeDateInput
                label="Período (vencimento)"
                min={vencMin}
                max={vencMax}
                onMinChange={(v) => {
                  setVencMin(v);
                  setPage(1);
                }}
                onMaxChange={(v) => {
                  setVencMax(v);
                  setPage(1);
                }}
                testIdPrefix="medicoes-filter-vencimento"
              />
              <RangeNumberInput
                label="Valor da medição"
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
                testIdPrefix="medicoes-filter-valor"
              />
            </AdvancedFiltersPopover>

            <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nº ou período..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                data-testid="medicoes-search"
              />
            </div>
          </div>

          {advancedActiveCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {statusSelected.map((s) => (
                <ActiveFilterChip
                  key={s}
                  label={`Status: ${MEDICAO_STATUS_CONFIG[s].label}`}
                  onRemove={() => setStatusSelected(statusSelected.filter((x) => x !== s))}
                  testId={`medicoes-active-chip-status-${s}`}
                />
              ))}
              {(vencMin || vencMax) && (
                <ActiveFilterChip
                  label={`Vencimento: ${formatBRDateRange(vencMin, vencMax)}`}
                  onRemove={() => {
                    setVencMin('');
                    setVencMax('');
                  }}
                  testId="medicoes-active-chip-vencimento"
                />
              )}
              {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
                <ActiveFilterChip
                  label={`Valor: ${formatValorRange(valorMin, valorMax)}`}
                  onRemove={() => {
                    setValorMin('');
                    setValorMax('');
                  }}
                  testId="medicoes-active-chip-valor"
                />
              )}
            </div>
          )}

          {isFiltering && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-primary">{filtered.length}</span> resultado{filtered.length === 1 ? '' : 's'} de {medicoes.length} medi{medicoes.length === 1 ? 'ção' : 'ções'}
            </p>
          )}
        </div>
      )}

      {/* Empty states */}
      {medicoes.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sem medições registradas.</p>
        </div>
      )}

      {medicoes.length > 0 && filtered.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhuma medição corresponde aos filtros.</p>
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
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-border-light dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                  {['Nº', 'Período', 'Valor medição', 'Valor pago', 'Vencimento', 'Pagamento', 'Status'].map(
                    (col) => (
                      <th
                        key={col}
                        className="text-left py-3 px-5 text-xs font-bold uppercase text-gray-500 tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {paginated.map((m, idx) => {
                  const cfg = MEDICAO_STATUS_CONFIG[m.status];
                  const isLast = idx === paginated.length - 1;
                  return (
                    <tr
                      key={m.id}
                      className={cn(
                        'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                        !isLast && 'border-b border-gray-50 dark:border-gray-800'
                      )}
                    >
                      <td className="py-3 px-5 text-sm font-bold text-gray-900 dark:text-gray-100">
                        {m.numero}
                      </td>
                      <td className="py-3 px-5 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        {m.periodo}
                      </td>
                      <td className="py-3 px-5 text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatCurrency(m.valorMedicao)}
                      </td>
                      <td className="py-3 px-5 text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {m.valorPago > 0 ? formatCurrency(m.valorPago) : '—'}
                      </td>
                      <td className="py-3 px-5 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {m.dataVencimento}
                      </td>
                      <td className="py-3 px-5 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {m.dataPagamento ?? '—'}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex flex-col gap-1">
                          <span
                            className={cn(
                              'inline-flex w-fit px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap',
                              cfg.className,
                            )}
                          >
                            {cfg.label}
                          </span>
                          {m.status === 'rejeitada_contratante' && m.motivoRejeicao && (
                            <span
                              className="text-[11px] text-rose-600 dark:text-rose-400 italic max-w-xs"
                              title={m.motivoRejeicao}
                            >
                              Motivo: {m.motivoRejeicao}
                            </span>
                          )}
                          {m.status === 'aprovada_contratante' && m.dataAprovacao && (
                            <span className="text-[11px] text-cyan-600 dark:text-cyan-400">
                              Aprovada em {m.dataAprovacao.split('-').reverse().join('/')}
                            </span>
                          )}
                          {m.status === 'rejeitada_contratante' && m.dataRejeicao && (
                            <span className="text-[11px] text-rose-500 dark:text-rose-400">
                              Rejeitada em {m.dataRejeicao.split('-').reverse().join('/')}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-xs text-muted-foreground tabular-nums">
            Mostrando {(safePage - 1) * MEDICOES_PAGE_SIZE + 1}–{Math.min(safePage * MEDICOES_PAGE_SIZE, filtered.length)} de {filtered.length}
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
              data-testid="medicoes-pagination-prev"
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
              data-testid="medicoes-pagination-next"
            >
              Próxima
              <RiArrowRightSLine className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoricoTab({ historico }: { historico: AdminObraHistoricoItem[] }) {
  const [visibleCount, setVisibleCount] = useState(HISTORICO_INITIAL_VISIBLE);
  const visible = historico.slice(0, visibleCount);
  const hasMore = visibleCount < historico.length;
  const remaining = historico.length - visibleCount;
  const nextLoad = Math.min(HISTORICO_LOAD_INCREMENT, remaining);

  if (historico.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Sem histórico registrado.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-xs text-muted-foreground tabular-nums">
          Mostrando {visible.length} de {historico.length}
        </span>
      </div>

      <div className="max-h-[480px] overflow-y-auto pr-2">
        <div className="space-y-0">
          {visible.map((item, idx) => {
            const Icon = HISTORICO_ICON[item.tipo];
            const colorClass = HISTORICO_COLOR[item.tipo];
            const isLast = idx === visible.length - 1;
            return (
              <div key={item.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 my-1" />}
                </div>
                <div className={cn('pb-5 flex-1 min-w-0', isLast && 'pb-0')}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.titulo}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{item.data}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{item.descricao}</p>
                  {item.valor !== undefined && (
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-1">
                      {formatCurrency(item.valor)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + HISTORICO_LOAD_INCREMENT)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-semibold bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            data-testid="obra-historico-load-more"
          >
            <RiArrowDownSLine className="w-4 h-4" />
            Carregar mais ({nextLoad})
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminObraDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useAdminObraDetalhe(id);
  const { data: obraHealth } = useObraHealth(id);
  const obra = data?.detalhe;
  const visibilidade = data?.visibilidade;
  const anexos = data?.anexos ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 md:p-10 animate-pulse">
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-10">
        <RiBuilding2Line className="w-16 h-16 text-gray-300 dark:text-gray-600" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Obra não encontrada</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-sm">
          Não encontramos nenhuma obra com o identificador informado.
        </p>
        <Link
          href="/admin/obras"
          className="flex items-center gap-2 text-sm font-bold text-[#1E88E5] hover:underline"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Voltar para Obras
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[obra.status] ?? STATUS_CONFIG.pausada;
  const safeDate = (iso: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
  };
  const progressColor =
    obra.status === 'em_andamento'
      ? 'bg-blue-500'
      : obra.status === 'concluida'
      ? 'bg-emerald-500'
      : obra.status === 'pausada'
      ? 'bg-amber-500'
      : 'bg-red-500';

  const saldoPagar = Math.max(0, obra.valorTotal - obra.valorPago);
  const percentPago =
    obra.valorTotal > 0
      ? Math.min(100, Math.max(0, Math.round((obra.valorPago / obra.valorTotal) * 100)))
      : 0;
  const health = obraHealth ?? null;

  const kpis = [
    {
      label: 'Valor total',
      value: formatCurrency(obra.valorTotal),
      sub: obra.aditivos > 0 ? `+ ${formatCurrency(obra.aditivos)} aditivos` : 'Sem aditivos',
      icon: RiMoneyDollarCircleLine,
      iconColor: 'bg-primary/10 text-primary',
    },
    {
      label: 'Total pago',
      value: formatCurrency(obra.valorPago),
      sub: `${percentPago}% do valor total`,
      icon: RiCheckboxCircleLine,
      iconColor: 'bg-[#22846D]/10 text-[#22846D]',
    },
    {
      label: 'Saldo a pagar',
      value: formatCurrency(saldoPagar),
      sub: `${100 - percentPago}% restante`,
      icon: RiWalletLine,
      iconColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
    },
    {
      label: 'Progresso',
      value: `${obra.percentConcluido}%`,
      sub: statusCfg.label,
      icon: RiBarChartLine,
      iconColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20',
    },
  ];

  return (
    <div className="space-y-6 p-6 md:p-10">
      {/* Breadcrumb */}
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/obras"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors w-fit font-medium"
        >
          <RiArrowLeftLine className="w-4 h-4" />
          Voltar para Obras
        </Link>
        <div className="flex items-center gap-1.5 text-sm">
          <Link href="/admin/obras" className="text-muted-foreground hover:text-primary transition-colors">
            Obras
          </Link>
          <RiArrowRightSLine className="w-4 h-4 text-gray-400" />
          <span className="font-bold text-gray-900 dark:text-white">{obra.nome}</span>
        </div>
      </div>

      {/* Hero Card */}
      <Card className="rounded-2xl border border-border-light dark:border-gray-800 shadow-sm overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <RiBuilding2Line className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                  {obra.nome}
                </h1>
                <span
                  className={cn(
                    'inline-flex px-3 py-1 rounded-full text-xs font-bold',
                    statusCfg.className
                  )}
                >
                  {statusCfg.label}
                </span>
                {visibilidade && (
                  <span
                    className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                    data-testid="badge-visibilidade"
                  >
                    {VISIBILIDADE_LABEL_MAP[visibilidade] ?? visibilidade}
                  </span>
                )}
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  {obra.tipo}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{obra.codigo}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <RiUserLine className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Cliente</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{obra.cliente}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RiHammerLine className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Empreiteira</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">{obra.empreiteira}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RiCalendarLine className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Período</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {safeDate(obra.dataInicio)} – {safeDate(obra.previsaoFim)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <RiMapPinLine className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Endereço</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {obra.numero ? `${obra.endereco}, ${obra.numero}` : obra.endereco}
                </p>
                {obra.complemento && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{obra.complemento}</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1.5">
              Progresso geral
            </p>
            <ProgressBar percent={obra.percentConcluido} color={progressColor} />
          </div>
        </CardContent>
      </Card>

      {/* Health summary card */}
      {health && <HealthCard health={health} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <LuminousHoverCard key={kpi.label} cardClassName="shadow-sm">
              <CardContent className="relative z-10 p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {kpi.label}
                  </span>
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', kpi.iconColor)}>
                    <kpi.icon className="w-4 h-4" />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
                </div>
              </CardContent>
          </LuminousHoverCard>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="financeiro">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1">
          <TabsTrigger
            value="saude"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            <RiHeartPulseLine className="w-4 h-4" />
            Saúde
          </TabsTrigger>
          <TabsTrigger
            value="financeiro"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            <RiFileListLine className="w-4 h-4" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            <RiTimeLine className="w-4 h-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger
            value="dados"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            <RiInformationLine className="w-4 h-4" />
            Dados Gerais
          </TabsTrigger>
          <TabsTrigger
            value="etapas"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            Etapas
          </TabsTrigger>
          <TabsTrigger
            value="diario"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            Diário
          </TabsTrigger>
          <TabsTrigger
            value="ocorrencias"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            Ocorrências
          </TabsTrigger>
          <TabsTrigger
            value="fotos"
            className="flex items-center gap-1.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 data-[state=active]:shadow-sm"
          >
            Fotos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="saude" className="mt-4">
          {health && <HealthDetailPanel health={health} />}
        </TabsContent>

        <TabsContent value="financeiro" className="mt-4">
          <MedicoesTab medicoes={obra.medicoes} />
        </TabsContent>

        <TabsContent value="historico" className="mt-4">
          <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm">
            <CardContent className="p-6">
              <HistoricoTab historico={obra.historico} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Informações da Obra
                </h3>
                {[
                  { label: 'Código', value: obra.codigo },
                  { label: 'Tipo', value: obra.tipo },
                  { label: 'Início', value: safeDate(obra.dataInicio) },
                  { label: 'Previsão de término', value: safeDate(obra.previsaoFim) },
                  { label: 'Localização', value: obra.localizacao ?? '—' },
                  { label: 'Endereço', value: obra.numero ? `${obra.endereco}, ${obra.numero}` : obra.endereco },
                  ...(obra.complemento ? [{ label: 'Complemento', value: obra.complemento }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-start gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{row.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Resumo Financeiro
                </h3>
                {[
                  { label: 'Valor contratado', value: formatCurrency(obra.valorContratado) },
                  { label: 'Aditivos', value: obra.aditivos > 0 ? formatCurrency(obra.aditivos) : '—' },
                  { label: 'Valor total', value: formatCurrency(obra.valorTotal) },
                  { label: 'Total pago', value: formatCurrency(obra.valorPago) },
                  { label: 'Saldo a pagar', value: formatCurrency(saldoPagar) },
                  {
                    label: 'Medições',
                    value: `${obra.medicoes.length} medição${obra.medicoes.length !== 1 ? 'ões' : ''}`,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-start gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">{row.label}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 text-right">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm" data-testid="card-anexos">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                    Anexos
                  </h3>
                  <span className="text-xs text-muted-foreground">{anexos.length}</span>
                </div>
                {anexos.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum anexo nesta obra.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {anexos.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center justify-between gap-3 py-2"
                        data-testid={`anexo-admin-${a.id}`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{a.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.tipo}{a.observacao ? ` · ${a.observacao}` : ''} · {safeDate(a.createdAt)}
                          </p>
                        </div>
                        {a.url && (
                          <a
                            href={a.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-primary hover:underline"
                            data-testid={`anexo-admin-download-${a.id}`}
                          >
                            Baixar
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-border-light dark:border-gray-800 shadow-sm">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
                  Partes Envolvidas
                </h3>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <RiUserLine className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Cliente</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{obra.cliente}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#22846D]/10 flex items-center justify-center flex-shrink-0">
                    <RiHammerLine className="w-4 h-4 text-[#22846D]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-bold">Empreiteira</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{obra.empreiteira}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="etapas" className="mt-4">
          <EtapasJ06Card obraId={obra.id} canWrite={false} canEditScope={false} />
        </TabsContent>
        <TabsContent value="diario" className="mt-4">
          <DiarioJ06Card obraId={obra.id} canWrite={false} />
        </TabsContent>
        <TabsContent value="ocorrencias" className="mt-4">
          <OcorrenciasJ06Card obraId={obra.id} canWrite={false} />
        </TabsContent>
        <TabsContent value="fotos" className="mt-4">
          <FotosJ06AdminTab obraId={obra.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FotosJ06AdminTab({ obraId }: { obraId: string }) {
  const user = useAuthStore((s) => s.user);
  return <FotosJ06Card obraId={obraId} canWrite={false} currentUserId={user?.id ?? null} currentUserRole={user?.role} />;
}
