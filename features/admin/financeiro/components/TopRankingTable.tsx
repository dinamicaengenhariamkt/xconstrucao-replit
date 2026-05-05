'use client';

import { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { cn } from '@shared/lib/utils';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import {
  RiSearchLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
} from 'react-icons/ri';
import { formatCurrencyRounded } from '@shared/lib/formatters';

export interface TopRankingItem {
  id: string;
  nome: string;
  obras: number;
  volContratado: number;
  pago: number;
  saldo: number;
}

interface TopRankingTableProps {
  items: TopRankingItem[];
  title: string;
  description: string;
  /** Label da primeira coluna (ex.: "Cliente" / "Empreiteira"). */
  entityLabel: string;
  searchPlaceholder?: string;
  testIdPrefix?: string;
  luminous?: boolean;
}

const PAGE_SIZE = 5;

export function TopRankingTable({
  items,
  title,
  description,
  entityLabel,
  searchPlaceholder = 'Buscar por nome...',
  testIdPrefix,
  luminous = false,
}: TopRankingTableProps) {
  const [obrasMin, setObrasMin] = useState('');
  const [obrasMax, setObrasMax] = useState('');
  const [volMin, setVolMin] = useState('');
  const [volMax, setVolMax] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const obrasMinNum = obrasMin === '' ? undefined : Number(obrasMin);
  const obrasMaxNum = obrasMax === '' ? undefined : Number(obrasMax);
  const volMinNum = volMin === '' ? undefined : Number(volMin);
  const volMaxNum = volMax === '' ? undefined : Number(volMax);

  const filtered = useMemo(() => {
    let result = items;
    if (obrasMinNum !== undefined) {
      result = result.filter((i) => i.obras >= obrasMinNum);
    }
    if (obrasMaxNum !== undefined) {
      result = result.filter((i) => i.obras <= obrasMaxNum);
    }
    if (volMinNum !== undefined) {
      result = result.filter((i) => i.volContratado >= volMinNum);
    }
    if (volMaxNum !== undefined) {
      result = result.filter((i) => i.volContratado <= volMaxNum);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.nome.toLowerCase().includes(q));
    }
    return result;
  }, [items, obrasMinNum, obrasMaxNum, volMinNum, volMaxNum, search]);

  const advancedActiveCount =
    (obrasMinNum !== undefined || obrasMaxNum !== undefined ? 1 : 0) +
    (volMinNum !== undefined || volMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setObrasMin('');
    setObrasMax('');
    setVolMin('');
    setVolMax('');
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

  return (
    <Card
      className={cn(
        'border-border-light dark:border-gray-800 overflow-hidden',
        luminous && 'luminous-section border-transparent shadow-none',
      )}
    >
      <CardHeader className="border-b border-gray-100 dark:border-gray-800 space-y-3">
        <div>
          <CardTitle className="text-base font-bold text-gray-900 dark:text-gray-100">
            {title}
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">{description}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAllAdvanced}
          >
            <RangeNumberInput
              label="Quantidade de obras"
              min={obrasMin}
              max={obrasMax}
              onMinChange={(v) => {
                setObrasMin(v);
                setPage(1);
              }}
              onMaxChange={(v) => {
                setObrasMax(v);
                setPage(1);
              }}
              testIdPrefix={testIdPrefix ? `${testIdPrefix}-filter-obras` : undefined}
            />
            <RangeNumberInput
              label="Volume contratado"
              min={volMin}
              max={volMax}
              onMinChange={(v) => {
                setVolMin(v);
                setPage(1);
              }}
              onMaxChange={(v) => {
                setVolMax(v);
                setPage(1);
              }}
              prefix="R$ "
              placeholderMin="100.000"
              placeholderMax="10.000.000"
              testIdPrefix={testIdPrefix ? `${testIdPrefix}-filter-volume` : undefined}
            />
          </AdvancedFiltersPopover>
          <div className="relative flex-1 min-w-0">
            <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-8 h-9 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid={testIdPrefix ? `${testIdPrefix}-search` : undefined}
            />
          </div>
        </div>
        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {(obrasMinNum !== undefined || obrasMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Obras: ${formatRange(obrasMin, obrasMax)}`}
                onRemove={() => {
                  setObrasMin('');
                  setObrasMax('');
                }}
                testId={testIdPrefix ? `${testIdPrefix}-active-chip-obras` : undefined}
              />
            )}
            {(volMinNum !== undefined || volMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Volume: ${formatRange(volMin, volMax, 'R$ ')}`}
                onRemove={() => {
                  setVolMin('');
                  setVolMax('');
                }}
                testId={testIdPrefix ? `${testIdPrefix}-active-chip-volume` : undefined}
              />
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {items.length === 0 ? 'Sem registros.' : 'Nenhum resultado para os filtros.'}
            </p>
            {items.length > 0 && (
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
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">
                      {entityLabel}
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">
                      Obras
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">
                      Vol. contratado
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">
                      Pago
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-bold uppercase text-gray-500 tracking-wider">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item, idx) => {
                    const isLast = idx === paginated.length - 1;
                    return (
                      <tr
                        key={item.id}
                        className={cn(
                          'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                          !isLast && 'border-b border-gray-50 dark:border-gray-800'
                        )}
                      >
                        <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-gray-100">
                          {item.nome}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-700 dark:text-gray-300 tabular-nums">
                          {item.obras}
                        </td>
                        <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-gray-100 tabular-nums">
                          {formatCurrencyRounded(item.volContratado)}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-[#22846D] tabular-nums">
                          {formatCurrencyRounded(item.pago)}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-amber-600 tabular-nums">
                          {formatCurrencyRounded(item.saldo)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-muted-foreground tabular-nums">
                  {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border transition-colors',
                      safePage === 1
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                        : 'cursor-pointer bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                    )}
                    data-testid={testIdPrefix ? `${testIdPrefix}-pagination-prev` : undefined}
                    aria-label="Página anterior"
                  >
                    <RiArrowLeftSLine className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className={cn(
                      'inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border transition-colors',
                      safePage === totalPages
                        ? 'opacity-40 cursor-not-allowed bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                        : 'cursor-pointer bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800',
                    )}
                    data-testid={testIdPrefix ? `${testIdPrefix}-pagination-next` : undefined}
                    aria-label="Próxima página"
                  >
                    <RiArrowRightSLine className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
