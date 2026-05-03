'use client';

import { useState, useMemo } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { cn } from '@shared/lib/utils';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { NovasObrasGrid } from '@features/empreiteiro/novas-obras/components/NovasObrasGrid';
import { NovasObrasSkeleton } from '@features/empreiteiro/novas-obras/components/NovasObrasSkeleton';
import { BlockedBanner } from '@features/empreiteiro/novas-obras/components/BlockedBanner';
import {
  useNovasObras,
  usePerfilStatus,
} from '@features/empreiteiro/novas-obras/hooks/use-novas-obras';
import {
  COMPLEXIDADE_LABELS,
  ITEMS_PER_PAGE,
  NOVAS_OBRAS_STATUS_LABELS,
  NOVAS_OBRAS_STATUS_DOT_CLASSES,
} from '@features/empreiteiro/novas-obras/constants';
import { AdvancedFiltersPopover } from '@features/shared/components/filters/AdvancedFiltersPopover';
import { ActiveFilterChip } from '@features/shared/components/filters/ActiveFilterChip';
import { MultiSelectDropdown } from '@features/shared/components/filters/MultiSelectDropdown';
import { RangeNumberInput } from '@features/shared/components/filters/RangeNumberInput';
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
import { formatRange } from '@shared/lib/formatters';

export default function NovasObrasPage() {
  const { data: obras, isLoading: obrasLoading } = useNovasObras();
  const { data: perfilStatus, isLoading: perfilLoading } = usePerfilStatus();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusSelected, setStatusSelected] = useState<string[]>([]);
  const [complexidadeSelected, setComplexidadeSelected] = useState<string[]>([]);
  const [tipoSelected, setTipoSelected] = useState<string[]>([]);
  const [orcamentoMin, setOrcamentoMin] = useState('');
  const [orcamentoMax, setOrcamentoMax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const orcMinNum = orcamentoMin === '' ? undefined : Number(orcamentoMin);
  const orcMaxNum = orcamentoMax === '' ? undefined : Number(orcamentoMax);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    (obras ?? []).forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(NOVAS_OBRAS_STATUS_LABELS).map(([value, label]) => ({
      value,
      label: `${label} (${counts[value] || 0})`,
    }));
  }, [obras]);

  const complexidadeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    (obras ?? []).forEach((o) => {
      counts[o.complexidade] = (counts[o.complexidade] || 0) + 1;
    });
    return Object.entries(COMPLEXIDADE_LABELS).map(([value, label]) => ({
      value,
      label: `${label} (${counts[value] || 0})`,
    }));
  }, [obras]);

  const tipoOptions = useMemo(() => {
    const set = new Set((obras ?? []).map((o) => o.tipo));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((t) => ({ value: t, label: t }));
  }, [obras]);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    let result = obras;
    if (statusSelected.length > 0) {
      result = result.filter((o) => statusSelected.includes(o.status));
    }
    if (complexidadeSelected.length > 0) {
      result = result.filter((o) => complexidadeSelected.includes(o.complexidade));
    }
    if (tipoSelected.length > 0) {
      result = result.filter((o) => tipoSelected.includes(o.tipo));
    }
    if (orcMinNum !== undefined) {
      result = result.filter((o) => o.orcamento >= orcMinNum);
    }
    if (orcMaxNum !== undefined) {
      result = result.filter((o) => o.orcamento <= orcMaxNum);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.titulo.toLowerCase().includes(q) ||
          o.endereco.toLowerCase().includes(q) ||
          o.tipo.toLowerCase().includes(q),
      );
    }
    return result;
  }, [
    obras,
    statusSelected,
    complexidadeSelected,
    tipoSelected,
    orcMinNum,
    orcMaxNum,
    searchQuery,
  ]);

  const totalPages = Math.ceil(filteredObras.length / ITEMS_PER_PAGE);
  const paginatedObras = filteredObras.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (complexidadeSelected.length > 0 ? 1 : 0) +
    (tipoSelected.length > 0 ? 1 : 0) +
    (orcMinNum !== undefined || orcMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    setComplexidadeSelected([]);
    setTipoSelected([]);
    setOrcamentoMin('');
    setOrcamentoMax('');
    setCurrentPage(1);
  };

  if (obrasLoading || perfilLoading) return <NovasObrasSkeleton />;

  const isBlocked = perfilStatus?.isBlocked ?? false;

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="novas-obras-empreiteiro-page">
      <div className="flex flex-col gap-6 mb-12">
        <PageHeader
          title="Novas Obras Disponíveis"
          subtitle="Encontre novas oportunidades de trabalho e candidate-se às obras disponíveis."
        />

        {isBlocked && perfilStatus && <BlockedBanner perfilStatus={perfilStatus} />}

        <div className={cn('flex flex-col gap-3', isBlocked && 'opacity-50 pointer-events-none')}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AdvancedFiltersPopover
              activeCount={advancedActiveCount}
              onClearAll={clearAllAdvanced}
            >
              <MultiSelectDropdown
                label="Status"
                options={statusOptions}
                values={statusSelected}
                onChange={onFilterChange(setStatusSelected)}
                placeholder="Todos os status"
                testIdPrefix="filter-status"
              />
              <MultiSelectDropdown
                label="Complexidade"
                options={complexidadeOptions}
                values={complexidadeSelected}
                onChange={onFilterChange(setComplexidadeSelected)}
                placeholder="Todas as complexidades"
                testIdPrefix="filter-complexidade"
              />
              <MultiSelectDropdown
                label="Tipo de obra"
                options={tipoOptions}
                values={tipoSelected}
                onChange={onFilterChange(setTipoSelected)}
                placeholder="Todos os tipos"
                testIdPrefix="filter-tipo"
              />
              <RangeNumberInput
                label="Orçamento"
                min={orcamentoMin}
                max={orcamentoMax}
                onMinChange={onFilterChange(setOrcamentoMin)}
                onMaxChange={onFilterChange(setOrcamentoMax)}
                prefix="R$ "
                placeholderMin="100.000"
                placeholderMax="5.000.000"
                testIdPrefix="filter-orcamento"
              />
            </AdvancedFiltersPopover>

            <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por título, endereço ou tipo..."
                value={searchQuery}
                onChange={(e) => onFilterChange(setSearchQuery)(e.target.value)}
                className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                data-testid="input-search-novas-obras"
              />
            </div>
          </div>

          {advancedActiveCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {statusSelected.map((s) => (
                <ActiveFilterChip
                  key={s}
                  label={`Status: ${NOVAS_OBRAS_STATUS_LABELS[s] ?? s}`}
                  onRemove={() =>
                    onFilterChange(setStatusSelected)(statusSelected.filter((x) => x !== s))
                  }
                  dotClassName={NOVAS_OBRAS_STATUS_DOT_CLASSES[s]}
                  testId={`active-chip-status-${s}`}
                />
              ))}
              {complexidadeSelected.map((c) => (
                <ActiveFilterChip
                  key={c}
                  label={`Complexidade: ${COMPLEXIDADE_LABELS[c] ?? c}`}
                  onRemove={() =>
                    onFilterChange(setComplexidadeSelected)(
                      complexidadeSelected.filter((x) => x !== c),
                    )
                  }
                  testId={`active-chip-complexidade-${c}`}
                />
              ))}
              {tipoSelected.map((t) => (
                <ActiveFilterChip
                  key={t}
                  label={`Tipo: ${t}`}
                  onRemove={() =>
                    onFilterChange(setTipoSelected)(tipoSelected.filter((x) => x !== t))
                  }
                  testId={`active-chip-tipo-${t}`}
                />
              ))}
              {(orcMinNum !== undefined || orcMaxNum !== undefined) && (
                <ActiveFilterChip
                  label={`Orçamento: ${formatRange(orcamentoMin, orcamentoMax, { prefix: 'R$ ' })}`}
                  onRemove={() => {
                    onFilterChange(setOrcamentoMin)('');
                    setOrcamentoMax('');
                  }}
                  testId="active-chip-orcamento"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <div className={cn(isBlocked && 'opacity-40 pointer-events-none')}>
        <NovasObrasGrid obras={paginatedObras} isBlocked={isBlocked} />
      </div>

      {totalPages > 1 && (
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
                data-testid="novas-obras-pagination-prev"
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
                    data-testid={`novas-obras-pagination-page-${item}`}
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
                data-testid="novas-obras-pagination-next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
