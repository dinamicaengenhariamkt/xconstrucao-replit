'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent, CardHeader } from '@shared/components/ui/card';
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
import { formatCurrency } from '@features/admin/financeiro/utils';
import { formatDate } from '@shared/lib/formatters';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
import { RiSearchLine } from 'react-icons/ri';
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
import { useMovimentacoes } from '../hooks/use-caixa';
import type { Movimentacao, CaixaPeriodo, DateRange } from '../types';

const STATUS_CLASSES: Record<string, string> = {
  confirmado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  pendente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  cancelado: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  confirmado: 'Confirmado',
  pendente: 'Pendente',
  cancelado: 'Cancelado',
};

const STATUS_OPTIONS = (Object.keys(STATUS_LABELS) as Movimentacao['status'][]).map((s) => ({
  value: s,
  label: STATUS_LABELS[s],
}));

const TIPO_OPTIONS: { value: Movimentacao['tipo']; label: string }[] = [
  { value: 'entrada', label: 'Entrada' },
  { value: 'saida', label: 'Saída' },
];

const PAGE_SIZE = 10;

function MovimentacaoRow({ mov }: { mov: Movimentacao }) {
  const isEntrada = mov.tipo === 'entrada';
  return (
    <TableRow className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
      <TableCell className="whitespace-nowrap">{formatDate(mov.data)}</TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={cn(
            'no-default-hover-elevate no-default-active-elevate',
            isEntrada
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          )}
        >
          {isEntrada ? 'Entrada' : 'Saída'}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[200px] truncate">{mov.descricao}</TableCell>
      <TableCell>{mov.categoria}</TableCell>
      <TableCell className="font-mono text-xs">{mov.referencia}</TableCell>
      <TableCell
        className={cn(
          'text-right font-semibold whitespace-nowrap',
          isEntrada ? 'text-[#22846D]' : 'text-red-600 dark:text-red-400'
        )}
      >
        {isEntrada ? '+' : '-'} {formatCurrency(mov.valor)}
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={cn('no-default-hover-elevate no-default-active-elevate', STATUS_CLASSES[mov.status])}
        >
          {STATUS_LABELS[mov.status]}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

interface MovimentacoesTableProps {
  periodo: CaixaPeriodo;
  customRange?: DateRange;
  luminous?: boolean;
}

export function MovimentacoesTable({ periodo, customRange, luminous = false }: MovimentacoesTableProps) {
  const { data: movimentacoes } = useMovimentacoes(periodo, customRange);
  const all = movimentacoes ?? [];

  const [tipoSelected, setTipoSelected] = useState<Movimentacao['tipo'][]>([]);
  const [statusSelected, setStatusSelected] = useState<Movimentacao['status'][]>([]);
  const [categoriasSelected, setCategoriasSelected] = useState<string[]>([]);
  const [valorMin, setValorMin] = useState('');
  const [valorMax, setValorMax] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const valorMinNum = valorMin === '' ? undefined : Number(valorMin);
  const valorMaxNum = valorMax === '' ? undefined : Number(valorMax);

  const categoriasOptions = useMemo(() => {
    const set = new Set<string>();
    all.forEach((m) => set.add(m.categoria));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((v) => ({ value: v, label: v }));
  }, [all]);

  const filtered = useMemo(() => {
    let result = all;
    if (tipoSelected.length > 0) {
      result = result.filter((m) => tipoSelected.includes(m.tipo));
    }
    if (statusSelected.length > 0) {
      result = result.filter((m) => statusSelected.includes(m.status));
    }
    if (categoriasSelected.length > 0) {
      result = result.filter((m) => categoriasSelected.includes(m.categoria));
    }
    if (valorMinNum !== undefined) {
      result = result.filter((m) => m.valor >= valorMinNum);
    }
    if (valorMaxNum !== undefined) {
      result = result.filter((m) => m.valor <= valorMaxNum);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.descricao.toLowerCase().includes(q) ||
          m.referencia.toLowerCase().includes(q),
      );
    }
    return result;
  }, [all, tipoSelected, statusSelected, categoriasSelected, valorMinNum, valorMaxNum, search]);

  const advancedActiveCount =
    (tipoSelected.length > 0 ? 1 : 0) +
    (statusSelected.length > 0 ? 1 : 0) +
    (categoriasSelected.length > 0 ? 1 : 0) +
    (valorMinNum !== undefined || valorMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setTipoSelected([]);
    setStatusSelected([]);
    setCategoriasSelected([]);
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

  return (
    <Card className={cn(luminous && 'luminous-section border-transparent shadow-none')}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Movimentações recentes
            </h2>
            <p className="text-sm text-muted-foreground">Últimas entradas e saídas do caixa</p>
          </div>
          {isFiltering && (
            <span className="text-xs text-muted-foreground tabular-nums">
              <span className="font-semibold text-primary">{filtered.length}</span> de {all.length}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
          <AdvancedFiltersPopover
            activeCount={advancedActiveCount}
            onClearAll={clearAllAdvanced}
          >
            <MultiSelectDropdown
              label="Tipo"
              options={TIPO_OPTIONS}
              values={tipoSelected}
              onChange={(next) => {
                setTipoSelected(next);
                setPage(1);
              }}
              placeholder="Entrada e saída"
              testIdPrefix="movimentacoes-filter-tipo"
            />
            <MultiSelectDropdown
              label="Status"
              options={STATUS_OPTIONS}
              values={statusSelected}
              onChange={(next) => {
                setStatusSelected(next);
                setPage(1);
              }}
              placeholder="Todos os status"
              testIdPrefix="movimentacoes-filter-status"
            />
            <MultiSelectDropdown
              label="Categoria"
              options={categoriasOptions}
              values={categoriasSelected}
              onChange={(next) => {
                setCategoriasSelected(next);
                setPage(1);
              }}
              placeholder="Todas as categorias"
              searchPlaceholder="Buscar categoria..."
              testIdPrefix="movimentacoes-filter-categoria"
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
              placeholderMin="1.000"
              placeholderMax="500.000"
              testIdPrefix="movimentacoes-filter-valor"
            />
          </AdvancedFiltersPopover>

          <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por descrição ou referência..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="movimentacoes-search"
            />
          </div>
        </div>

        {advancedActiveCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-3">
            {tipoSelected.map((t) => (
              <ActiveFilterChip
                key={t}
                label={`Tipo: ${t === 'entrada' ? 'Entrada' : 'Saída'}`}
                onRemove={() => setTipoSelected(tipoSelected.filter((x) => x !== t))}
                testId={`movimentacoes-active-chip-tipo-${t}`}
              />
            ))}
            {statusSelected.map((s) => (
              <ActiveFilterChip
                key={s}
                label={`Status: ${STATUS_LABELS[s]}`}
                onRemove={() => setStatusSelected(statusSelected.filter((x) => x !== s))}
                testId={`movimentacoes-active-chip-status-${s}`}
              />
            ))}
            {categoriasSelected.map((c) => (
              <ActiveFilterChip
                key={c}
                label={`Categoria: ${c}`}
                onRemove={() => setCategoriasSelected(categoriasSelected.filter((x) => x !== c))}
                testId={`movimentacoes-active-chip-categoria-${c}`}
              />
            ))}
            {(valorMinNum !== undefined || valorMaxNum !== undefined) && (
              <ActiveFilterChip
                label={`Valor: ${formatRange(valorMin, valorMax, 'R$ ')}`}
                onRemove={() => {
                  setValorMin('');
                  setValorMax('');
                }}
                testId="movimentacoes-active-chip-valor"
              />
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {all.length === 0 ? 'Sem movimentações no período.' : 'Nenhuma movimentação corresponde aos filtros.'}
            </p>
            {all.length > 0 && (
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((mov) => (
                  <MovimentacaoRow key={mov.id} mov={mov} />
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-muted-foreground tabular-nums">
                  Mostrando {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} de {filtered.length}
                </p>
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.max(1, p - 1));
                        }}
                        aria-disabled={safePage === 1}
                        className={safePage === 1 ? 'pointer-events-none opacity-50' : ''}
                        data-testid="movimentacoes-pagination-prev"
                      />
                    </PaginationItem>
                    {getPaginationRange(safePage, totalPages).map((item, idx) =>
                      item === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${idx}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href="#"
                            isActive={safePage === item}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(item);
                            }}
                            data-testid={`movimentacoes-pagination-page-${item}`}
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
                        aria-disabled={safePage === totalPages}
                        className={safePage === totalPages ? 'pointer-events-none opacity-50' : ''}
                        data-testid="movimentacoes-pagination-next"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
