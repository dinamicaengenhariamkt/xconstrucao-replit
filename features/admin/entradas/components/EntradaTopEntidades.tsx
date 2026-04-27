'use client';

import { useMemo, useState } from 'react';
import { Card } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { cn } from '@shared/lib/utils';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import { RiSearchLine } from 'react-icons/ri';
import type { EntradaTopItem } from '../types';
import { formatCurrency } from '@shared/lib/formatters';

const TOP_N_OPTIONS = [5, 10, 15, 20] as const;
type TopN = (typeof TOP_N_OPTIONS)[number];

interface TopTableProps {
  title: string;
  description: string;
  entityLabel: string;
  items: EntradaTopItem[];
  testIdPrefix: string;
}

function TopTable({ title, description, entityLabel, items, testIdPrefix }: TopTableProps) {
  const [search, setSearch] = useState('');
  const [obrasMin, setObrasMin] = useState('');
  const [obrasMax, setObrasMax] = useState('');
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [topN, setTopN] = useState<TopN>(10);

  const obrasMinNum = obrasMin === '' ? undefined : Number(obrasMin);
  const obrasMaxNum = obrasMax === '' ? undefined : Number(obrasMax);
  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const filtered = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) => i.nome.toLowerCase().includes(q));
    }
    if (obrasMinNum !== undefined) {
      result = result.filter((i) => i.obras >= obrasMinNum);
    }
    if (obrasMaxNum !== undefined) {
      result = result.filter((i) => i.obras <= obrasMaxNum);
    }
    if (valorMinNum !== undefined) {
      result = result.filter((i) => i.totalEntradas >= valorMinNum);
    }
    if (valorMaxNum !== undefined) {
      result = result.filter((i) => i.totalEntradas <= valorMaxNum);
    }
    return result.slice(0, topN);
  }, [items, search, obrasMinNum, obrasMaxNum, valorMinNum, valorMaxNum, topN]);

  const advancedActiveCount =
    (obrasMinNum !== undefined || obrasMaxNum !== undefined ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0) +
    (topN !== 10 ? 1 : 0);

  const clearAllAdvanced = () => {
    setObrasMin('');
    setObrasMax('');
    setValorMin('');
    setValorMax('');
    setTopN(10);
  };

  const formatRange = (min: string, max: string, prefix = '') => {
    const minPart = min ? `${prefix}${min}` : `${prefix}0`;
    const maxPart = max ? `${prefix}${max}` : '∞';
    return `${minPart} – ${maxPart}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 space-y-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAllAdvanced}
          >
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Quantos exibir
              </p>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
                {TOP_N_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setTopN(n)}
                    className={cn(
                      'px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer',
                      topN === n
                        ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    )}
                    data-testid={`${testIdPrefix}-top-${n}`}
                  >
                    Top {n}
                  </button>
                ))}
              </div>
            </div>
            <RangeNumberInput
              label="Quantidade de obras"
              min={obrasMin}
              max={obrasMax}
              onMinChange={setObrasMin}
              onMaxChange={setObrasMax}
              testIdPrefix={`${testIdPrefix}-filter-obras`}
            />
            <RangeNumberInput
              label="Total de entradas"
              min={valorMin}
              max={valorMax}
              onMinChange={setValorMin}
              onMaxChange={setValorMax}
              prefix="R$ "
              placeholderMin="100.000"
              placeholderMax="10.000.000"
              testIdPrefix={`${testIdPrefix}-filter-valor`}
            />
          </AdvancedFiltersPopover>

          <div className="relative flex-1 min-w-0">
            <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <Input
              placeholder={`Buscar ${entityLabel.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid={`${testIdPrefix}-search`}
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {topN !== 10 && (
              <ActiveFilterChip
                label={`Top ${topN}`}
                onRemove={() => setTopN(10)}
                testId={`${testIdPrefix}-active-chip-top`}
              />
            )}
            {(obrasMinNum !== undefined || obrasMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Obras: ${formatRange(obrasMin, obrasMax)}`}
                onRemove={() => {
                  setObrasMin('');
                  setObrasMax('');
                }}
                testId={`${testIdPrefix}-active-chip-obras`}
              />
            )}
            {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Total: ${formatRange(valorMin, valorMax, 'R$ ')}`}
                onRemove={() => {
                  setValorMin('');
                  setValorMax('');
                }}
                testId={`${testIdPrefix}-active-chip-valor`}
              />
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Nenhum resultado para os filtros.
            </p>
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
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                <TableHead className="text-xs font-bold uppercase tracking-wider">{entityLabel}</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Nº de obras</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider">Total de entradas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.nome}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <TableCell className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {item.nome}
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                    {item.obras}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-[#22846D]">
                    {formatCurrency(item.totalEntradas)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
}

interface EntradaTopEntidadesProps {
  clientes: EntradaTopItem[];
  empreiteiras: EntradaTopItem[];
}

export function EntradaTopEntidades({ clientes, empreiteiras }: EntradaTopEntidadesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <TopTable
        title="Top clientes por receita"
        description="Clientes com maior volume de entradas no período"
        entityLabel="Cliente"
        items={clientes}
        testIdPrefix="top-clientes-entradas"
      />
      <TopTable
        title="Top empreiteiras por receita"
        description="Empreiteiras com maior volume de entradas no período"
        entityLabel="Empreiteira"
        items={empreiteiras}
        testIdPrefix="top-empreiteiras-entradas"
      />
    </div>
  );
}
