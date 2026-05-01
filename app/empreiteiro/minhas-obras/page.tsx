'use client';

import { useState, useMemo } from 'react';
import { RiSearchLine } from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { MinhasObrasGrid } from '@features/empreiteiro/minhas-obras/components/MinhasObrasGrid';
import { MinhasObrasSkeleton } from '@features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton';
import { useMinhasObras } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import { ITEMS_PER_PAGE } from '@features/empreiteiro/minhas-obras/constants';
import { STATUS_LABELS } from '@shared/constants/status';
import {
  HealthFilterSelect,
  HEALTH_LABELS,
  HEALTH_DOT_CLASSES,
  getMockHealth,
  getMockHealthSummary,
  useSaudeFilter,
} from '@features/shared/health';
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

export default function MinhasObrasPage() {
  const { data: obras, isLoading } = useMinhasObras();
  const saude = useSaudeFilter();
  const [statusSelected, setStatusSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tipoSelected, setTipoSelected] = useState<string[]>([]);
  const [contratanteSelected, setContratanteSelected] = useState<string[]>([]);
  const [orcamentoMin, setOrcamentoMin] = useState('');
  const [orcamentoMax, setOrcamentoMax] = useState('');
  const [progressoMin, setProgressoMin] = useState('');
  const [progressoMax, setProgressoMax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const orcMinNum = orcamentoMin === '' ? undefined : Number(orcamentoMin);
  const orcMaxNum = orcamentoMax === '' ? undefined : Number(orcamentoMax);
  const progMinNum = progressoMin === '' ? undefined : Number(progressoMin);
  const progMaxNum = progressoMax === '' ? undefined : Number(progressoMax);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setCurrentPage(1);
  };

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    (obras ?? []).forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(STATUS_LABELS).map(([value, label]) => ({
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

  const contratanteOptions = useMemo(() => {
    const set = new Set((obras ?? []).map((o) => o.contratante.nome));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((n) => ({ value: n, label: n }));
  }, [obras]);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    let result = obras;
    if (statusSelected.length > 0) {
      result = result.filter((o) => statusSelected.includes(o.status));
    }
    if (saude.value) {
      result = result.filter((o) => getMockHealth(o.id).status === saude.value);
    }
    if (tipoSelected.length > 0) {
      result = result.filter((o) => tipoSelected.includes(o.tipo));
    }
    if (contratanteSelected.length > 0) {
      result = result.filter((o) => contratanteSelected.includes(o.contratante.nome));
    }
    if (orcMinNum !== undefined) {
      result = result.filter((o) => o.orcamento >= orcMinNum);
    }
    if (orcMaxNum !== undefined) {
      result = result.filter((o) => o.orcamento <= orcMaxNum);
    }
    if (progMinNum !== undefined) {
      result = result.filter((o) => o.progresso >= progMinNum);
    }
    if (progMaxNum !== undefined) {
      result = result.filter((o) => o.progresso <= progMaxNum);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) => o.titulo.toLowerCase().includes(q) || o.endereco.toLowerCase().includes(q),
      );
    }
    return result;
  }, [
    obras,
    statusSelected,
    saude.value,
    tipoSelected,
    contratanteSelected,
    orcMinNum,
    orcMaxNum,
    progMinNum,
    progMaxNum,
    searchQuery,
  ]);

  const totalPages = Math.ceil(filteredObras.length / ITEMS_PER_PAGE);
  const paginatedObras = filteredObras.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const healthSummary = useMemo(
    () => getMockHealthSummary((obras ?? []).map((o) => o.id)),
    [obras],
  );

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (saude.value ? 1 : 0) +
    (tipoSelected.length > 0 ? 1 : 0) +
    (contratanteSelected.length > 0 ? 1 : 0) +
    (orcMinNum !== undefined || orcMaxNum !== undefined ? 1 : 0) +
    (progMinNum !== undefined || progMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    saude.setValue(undefined);
    setTipoSelected([]);
    setContratanteSelected([]);
    setOrcamentoMin('');
    setOrcamentoMax('');
    setProgressoMin('');
    setProgressoMax('');
    setCurrentPage(1);
  };

  if (isLoading) return <MinhasObrasSkeleton />;

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="minhas-obras-empreiteiro-page">
      <div className="flex flex-col gap-6 mb-12">
        <PageHeader
          title="Minhas Obras"
          subtitle="Gerencie suas obras em execução e acompanhe o progresso operacional."
        />
        <div className="flex flex-col gap-3">
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
              <HealthFilterSelect
                value={saude.value}
                onChange={onFilterChange(saude.setValue)}
                summary={healthSummary}
              />
              <MultiSelectDropdown
                label="Tipo de obra"
                options={tipoOptions}
                values={tipoSelected}
                onChange={onFilterChange(setTipoSelected)}
                placeholder="Todos os tipos"
                testIdPrefix="filter-tipo"
              />
              <MultiSelectDropdown
                label="Contratante"
                options={contratanteOptions}
                values={contratanteSelected}
                onChange={onFilterChange(setContratanteSelected)}
                placeholder="Todos os contratantes"
                searchPlaceholder="Buscar contratante..."
                testIdPrefix="filter-contratante"
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
              <RangeNumberInput
                label="Progresso (%)"
                min={progressoMin}
                max={progressoMax}
                onMinChange={onFilterChange(setProgressoMin)}
                onMaxChange={onFilterChange(setProgressoMax)}
                placeholderMin="0"
                placeholderMax="100"
                testIdPrefix="filter-progresso"
              />
            </AdvancedFiltersPopover>

            <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por título ou endereço..."
                value={searchQuery}
                onChange={(e) => onFilterChange(setSearchQuery)(e.target.value)}
                className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                data-testid="input-search-obras"
              />
            </div>
          </div>

          {advancedActiveCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {statusSelected.map((s) => (
                <ActiveFilterChip
                  key={s}
                  label={`Status: ${STATUS_LABELS[s] ?? s}`}
                  onRemove={() =>
                    onFilterChange(setStatusSelected)(statusSelected.filter((x) => x !== s))
                  }
                  testId={`active-chip-status-${s}`}
                />
              ))}
              {saude.value && (
                <ActiveFilterChip
                  label={`Saúde: ${HEALTH_LABELS[saude.value]}`}
                  onRemove={() => onFilterChange(saude.setValue)(undefined)}
                  dotClassName={HEALTH_DOT_CLASSES[saude.value]}
                  testId="active-chip-saude"
                />
              )}
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
              {contratanteSelected.map((nome) => (
                <ActiveFilterChip
                  key={nome}
                  label={`Contratante: ${nome}`}
                  onRemove={() =>
                    onFilterChange(setContratanteSelected)(
                      contratanteSelected.filter((x) => x !== nome),
                    )
                  }
                  testId={`active-chip-contratante-${nome}`}
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
              {(progMinNum !== undefined || progMaxNum !== undefined) && (
                <ActiveFilterChip
                  label={`Progresso: ${formatRange(progressoMin, progressoMax, { suffix: '%' })}`}
                  onRemove={() => {
                    onFilterChange(setProgressoMin)('');
                    setProgressoMax('');
                  }}
                  testId="active-chip-progresso"
                />
              )}
            </div>
          )}
        </div>
      </div>

      <MinhasObrasGrid obras={paginatedObras} />

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
                data-testid="empreiteiro-obras-pagination-prev"
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
                    data-testid={`empreiteiro-obras-pagination-page-${item}`}
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
                data-testid="empreiteiro-obras-pagination-next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
