'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { Input } from '@shared/components/ui/input';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import {
  RiSearchLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import type { ObrasAtencaoTableProps, ProgressBarProps, SituacaoKey } from '../types';
import { SITUACAO_CONFIG } from '../constants';
import { formatCurrency } from '../utils';

const PAGE_SIZE = 5;

const SITUACAO_OPTIONS = (Object.keys(SITUACAO_CONFIG) as SituacaoKey[]).map((s) => ({
  value: s,
  label: SITUACAO_CONFIG[s].label,
}));

function ProgressBar({ percent }: ProgressBarProps) {
  const barColor =
    percent >= 70 ? 'bg-[#22846D]' : percent >= 40 ? 'bg-[#F5A623]' : 'bg-[#E53935]';

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{percent}%</span>
    </div>
  );
}

export function ObrasAtencaoTable({ obras }: ObrasAtencaoTableProps) {
  const [situacaoSelected, setSituacaoSelected] = useState<SituacaoKey[]>([]);
  const [percentMin, setPercentMin] = useState('');
  const [percentMax, setPercentMax] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const percentMinNum = percentMin === '' ? undefined : Number(percentMin);
  const percentMaxNum = percentMax === '' ? undefined : Number(percentMax);
  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const filtered = useMemo(() => {
    let result = obras;
    if (situacaoSelected.length > 0) {
      result = result.filter((o) => situacaoSelected.includes(o.situacao));
    }
    if (percentMinNum !== undefined) {
      result = result.filter((o) => o.percentConcluido >= percentMinNum);
    }
    if (percentMaxNum !== undefined) {
      result = result.filter((o) => o.percentConcluido <= percentMaxNum);
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
          o.cliente.toLowerCase().includes(q) ||
          o.empreiteira.toLowerCase().includes(q),
      );
    }
    return result;
  }, [obras, situacaoSelected, percentMinNum, percentMaxNum, valorMinNum, valorMaxNum, search]);

  const advancedActiveCount =
    (situacaoSelected.length > 0 ? 1 : 0) +
    (percentMinNum !== undefined || percentMaxNum !== undefined ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setSituacaoSelected([]);
    setPercentMin('');
    setPercentMax('');
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

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAllAdvanced}
          >
            <MultiSelectDropdown
              label="Situação"
              options={SITUACAO_OPTIONS}
              values={situacaoSelected}
              onChange={(next) => {
                setSituacaoSelected(next);
                setPage(1);
              }}
              placeholder="Todas as situações"
              testIdPrefix="obras-atencao-filter-situacao"
            />
            <RangeNumberInput
              label="% Concluído"
              min={percentMin}
              max={percentMax}
              onMinChange={(v) => {
                setPercentMin(v);
                setPage(1);
              }}
              onMaxChange={(v) => {
                setPercentMax(v);
                setPage(1);
              }}
              placeholderMin="0"
              placeholderMax="100"
              testIdPrefix="obras-atencao-filter-percent"
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
              placeholderMin="500.000"
              placeholderMax="10.000.000"
              testIdPrefix="obras-atencao-filter-valor"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por código, obra, cliente..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="obras-atencao-search"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {situacaoSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Situação: ${SITUACAO_CONFIG[s].label}`}
                onRemove={() => setSituacaoSelected(situacaoSelected.filter((x) => x !== s))}
                testId={`obras-atencao-active-chip-situacao-${s}`}
              />
            ))}
            {(percentMinNum !== undefined || percentMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Concluído: ${formatRange(percentMin, percentMax, '', '%')}`}
                onRemove={() => {
                  setPercentMin('');
                  setPercentMax('');
                }}
                testId="obras-atencao-active-chip-percent"
              />
            )}
            {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Valor: ${formatRange(valorMin, valorMax, 'R$ ')}`}
                onRemove={() => {
                  setValorMin('');
                  setValorMax('');
                }}
                testId="obras-atencao-active-chip-valor"
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

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-border-light dark:border-gray-800 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {obras.length === 0 ? 'Sem obras com atenção financeira.' : 'Nenhuma obra corresponde aos filtros.'}
            </p>
            {obras.length > 0 && (
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
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">Obra</th>
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">Cliente</th>
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">Empreiteira</th>
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">Valor contratado</th>
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">Valor pago</th>
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">% Concluído</th>
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">Situação</th>
                    <th className="text-right py-4 px-6 text-xs font-bold uppercase text-gray-500 tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((obra, idx) => {
                    const config = SITUACAO_CONFIG[obra.situacao];
                    const isLast = idx === paginated.length - 1;
                    return (
                      <tr
                        key={obra.id}
                        className={cn(
                          'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                          !isLast && 'border-b border-gray-50 dark:border-gray-800'
                        )}
                      >
                        <td className="py-4 px-6">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{obra.nome}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Cód. {obra.codigo}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{obra.cliente}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-gray-700 dark:text-gray-300">{obra.empreiteira}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(obra.valorContratado)}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(obra.valorPago)}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <ProgressBar percent={obra.percentConcluido} />
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={cn(
                              'inline-flex px-3 py-1 rounded-full text-xs font-bold',
                              config.className
                            )}
                          >
                            {config.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link
                            href={`/admin/financeiro/obras/${obra.id}`}
                            className="text-sm font-bold text-[#1E88E5] hover:underline"
                          >
                            Ver detalhes
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-gray-100 dark:border-gray-800">
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
                    data-testid="obras-atencao-pagination-prev"
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
                    data-testid="obras-atencao-pagination-next"
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
