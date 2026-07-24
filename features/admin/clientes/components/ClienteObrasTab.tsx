'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { Skeleton } from '@shared/components/ui/skeleton';
import { Input } from '@shared/components/ui/input';
import { ProgressBar } from '@features/shared/components/ProgressBar';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import {
  RiExternalLinkLine,
  RiEdit2Line,
  RiBriefcaseLine,
  RiSearchLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import type { AdminClienteObra } from '../types';
import { formatCurrency, formatDate } from '@shared/lib/formatters';

type ObraStatus = AdminClienteObra['status'];

const STATUS_CONFIG: Record<ObraStatus, {
  label: string;
  className: string;
  progressColor: 'info' | 'success' | 'warning' | 'error';
}> = {
  em_andamento: {
    label: 'Em andamento',
    className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    progressColor: 'info',
  },
  concluida: {
    label: 'Concluída',
    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    progressColor: 'success',
  },
  pausada: {
    label: 'Pausada',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    progressColor: 'warning',
  },
  planejamento: {
    label: 'Planejamento',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    progressColor: 'info',
  },
};

const STATUS_OPTIONS = (Object.keys(STATUS_CONFIG) as ObraStatus[]).map((s) => ({
  value: s,
  label: STATUS_CONFIG[s].label,
}));

const PAGE_SIZE = 10;

interface ClienteObrasTabProps {
  obras: AdminClienteObra[];
  isLoading: boolean;
  onEditObra?: (obra: AdminClienteObra) => void;
}

export function ClienteObrasTab({ obras, isLoading, onEditObra }: ClienteObrasTabProps) {
  const [statusSelected, setStatusSelected] = useState<ObraStatus[]>([]);
  const [progressMin, setProgressMin] = useState('');
  const [progressMax, setProgressMax] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const progressMinNum = progressMin === '' ? undefined : Number(progressMin);
  const progressMaxNum = progressMax === '' ? undefined : Number(progressMax);
  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const filtered = useMemo(() => {
    let result = obras;
    if (statusSelected.length > 0) {
      result = result.filter((o) => statusSelected.includes(o.status));
    }
    if (progressMinNum !== undefined) {
      result = result.filter((o) => o.percentConcluido >= progressMinNum);
    }
    if (progressMaxNum !== undefined) {
      result = result.filter((o) => o.percentConcluido <= progressMaxNum);
    }
    if (valorMinNum !== undefined) {
      result = result.filter((o) => o.valorContratado >= valorMinNum);
    }
    if (valorMaxNum !== undefined) {
      result = result.filter((o) => o.valorContratado <= valorMaxNum);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.nome.toLowerCase().includes(q) ||
          o.codigo.toLowerCase().includes(q) ||
          (o.empreiteira?.toLowerCase().includes(q) ?? false) ||
          (o.localizacao?.toLowerCase().includes(q) ?? false),
      );
    }
    return result;
  }, [obras, statusSelected, progressMinNum, progressMaxNum, valorMinNum, valorMaxNum, search]);

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (progressMinNum !== undefined || progressMaxNum !== undefined ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setProgressMin('');
    setProgressMax('');
    setValorMin('');
    setValorMax('');
    setPage(1);
  };

  const formatRange = (min: string, max: string, prefix = '', suffix = '') => {
    const minPart = min ? `${prefix}${min}${suffix}` : `${prefix}0${suffix}`;
    const maxPart = max ? `${prefix}${max}${suffix}` : '∞';
    return `${minPart} – ${maxPart}`;
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const isFiltering = advancedActiveCount > 0 || search.trim().length > 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (obras.length === 0) {
    return (
      <div className="text-center py-12">
        <RiBriefcaseLine className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Este cliente ainda não possui obras cadastradas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
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
              testIdPrefix="cliente-obras-filter-status"
            />
            <RangeNumberInput
              label="Progresso (%)"
              min={progressMin}
              max={progressMax}
              onMinChange={(v) => {
                setProgressMin(v);
                setPage(1);
              }}
              onMaxChange={(v) => {
                setProgressMax(v);
                setPage(1);
              }}
              placeholderMin="0"
              placeholderMax="100"
              testIdPrefix="cliente-obras-filter-progresso"
            />
            <RangeNumberInput
              label="Valor contratado"
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
              placeholderMin="100.000"
              placeholderMax="10.000.000"
              testIdPrefix="cliente-obras-filter-valor"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por nome, código, empreiteira..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="cliente-obras-search"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {statusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${STATUS_CONFIG[s].label}`}
                onRemove={() => setStatusSelected(statusSelected.filter((x) => x !== s))}
                testId={`cliente-obras-active-chip-status-${s}`}
              />
            ))}
            {(progressMinNum !== undefined || progressMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Progresso: ${formatRange(progressMin, progressMax, '', '%')}`}
                onRemove={() => {
                  setProgressMin('');
                  setProgressMax('');
                }}
                testId="cliente-obras-active-chip-progresso"
              />
            )}
            {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Valor: ${formatRange(valorMin, valorMax, 'R$ ')}`}
                onRemove={() => {
                  setValorMin('');
                  setValorMax('');
                }}
                testId="cliente-obras-active-chip-valor"
              />
            )}
          </div>
        )}

        {isFiltering && (
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{filtered.length}</span> resultado{filtered.length === 1 ? '' : 's'} de {obras.length} obra{obras.length === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {/* Filtered empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-10">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Nenhuma obra corresponde aos filtros.</p>
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
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Obra</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider min-w-[160px]">Progresso</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Valor</th>
                  <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Prazo</th>
                  <th className="text-right py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((obra, index) => {
                  const statusCfg = STATUS_CONFIG[obra.status];
                  return (
                    <tr
                      key={obra.id}
                      className={cn(
                        'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                        index < paginated.length - 1 && 'border-b border-gray-50 dark:border-gray-800/60',
                      )}
                    >
                      <td className="py-4 px-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{obra.nome}</p>
                        {obra.localizacao && (
                          <p className="text-xs text-muted-foreground mt-0.5">{obra.localizacao}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-bold', statusCfg.className)}>
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3 min-w-[140px]">
                          <div className="flex-1">
                            <ProgressBar value={obra.percentConcluido} color={statusCfg.progressColor} size="sm" />
                          </div>
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 tabular-nums w-8 text-right">
                            {obra.percentConcluido}%
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                          {formatCurrency(obra.valorContratado)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                          {formatDate(obra.previsaoFim)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/obras/${obra.id}`} title="Ver detalhes">
                            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary dark:hover:text-white transition-colors cursor-pointer">
                              <RiExternalLinkLine className="w-4 h-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => onEditObra?.(obra)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary dark:hover:text-white transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <RiEdit2Line className="w-4 h-4" />
                          </button>
                        </div>
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
                  data-testid="cliente-obras-pagination-prev"
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
                  data-testid="cliente-obras-pagination-next"
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
  );
}
