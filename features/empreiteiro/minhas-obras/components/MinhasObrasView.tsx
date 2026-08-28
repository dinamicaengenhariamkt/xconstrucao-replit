'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RiSearchLine } from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { MinhasObrasGrid } from './MinhasObrasGrid';
import { MinhasObrasSkeleton } from './MinhasObrasSkeleton';
import { useMinhasObras } from '../hooks/use-minhas-obras';
import { ITEMS_PER_PAGE } from '../constants';
import { STATUS_LABELS } from '@shared/constants/status';
import {
  HealthFilterSelect,
  HEALTH_LABELS,
  HEALTH_DOT_CLASSES,
  useObrasHealthMap,
  summarizeHealthMap,
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
import { NovaObraModal } from '@features/xgestao/components/NovaObraModal';

type MinhasObrasViewProps = {
  basePath: string;
  xgestao?: boolean;
};

export function MinhasObrasView({ basePath, xgestao = false }: MinhasObrasViewProps) {
  const { data: obras, isLoading } = useMinhasObras();
  const { data: healthMap } = useObrasHealthMap('empreiteiro');
  const searchParams = useSearchParams();
  const saude = useSaudeFilter();
  const [statusSelected, setStatusSelected] = useState<string[]>(() => {
    const param = searchParams?.get('status');
    if (!param) return [];
    return param
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s in STATUS_LABELS);
  });
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
    (obras ?? []).filter((o) => !xgestao || o.isObraPropria).forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(STATUS_LABELS).map(([value, label]) => ({
      value,
      label: `${label} (${counts[value] || 0})`,
    }));
  }, [obras, xgestao]);

  const tipoOptions = useMemo(() => {
    const set = new Set((obras ?? []).filter((o) => !xgestao || o.isObraPropria).map((o) => o.tipo));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((t) => ({ value: t, label: t }));
  }, [obras, xgestao]);

  const contratanteOptions = useMemo(() => {
    const set = new Set((obras ?? []).filter((o) => o.temContratante).map((o) => o.contratante.nome));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((n) => ({ value: n, label: n }));
  }, [obras]);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    let result = xgestao ? obras.filter((obra) => obra.isObraPropria) : obras;
    if (statusSelected.length > 0) result = result.filter((o) => statusSelected.includes(o.status));
    if (saude.value) result = result.filter((o) => healthMap?.[o.id]?.status === saude.value);
    if (tipoSelected.length > 0) result = result.filter((o) => tipoSelected.includes(o.tipo));
    if (contratanteSelected.length > 0) {
      result = result.filter((o) => o.temContratante && contratanteSelected.includes(o.contratante.nome));
    }
    if (orcMinNum !== undefined) result = result.filter((o) => o.orcamento >= orcMinNum);
    if (orcMaxNum !== undefined) result = result.filter((o) => o.orcamento <= orcMaxNum);
    if (progMinNum !== undefined) result = result.filter((o) => o.progresso >= progMinNum);
    if (progMaxNum !== undefined) result = result.filter((o) => o.progresso <= progMaxNum);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (o) => o.titulo.toLowerCase().includes(query) || o.endereco.toLowerCase().includes(query),
      );
    }
    return result;
  }, [
    obras,
    healthMap,
    statusSelected,
    saude.value,
    tipoSelected,
    contratanteSelected,
    orcMinNum,
    orcMaxNum,
    progMinNum,
    progMaxNum,
    searchQuery,
    xgestao,
  ]);

  const totalPages = Math.ceil(filteredObras.length / ITEMS_PER_PAGE);
  const paginatedObras = filteredObras.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const healthSummary = useMemo(() => {
    if (!xgestao) return summarizeHealthMap(healthMap);
    const ownIds = new Set((obras ?? []).filter((obra) => obra.isObraPropria).map((obra) => obra.id));
    return summarizeHealthMap(
      Object.fromEntries(Object.entries(healthMap ?? {}).filter(([obraId]) => ownIds.has(obraId))),
    );
  }, [healthMap, obras, xgestao]);
  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (saude.value ? 1 : 0) +
    (tipoSelected.length > 0 ? 1 : 0) +
    (!xgestao && contratanteSelected.length > 0 ? 1 : 0) +
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
    <div
      className="mb-12 flex flex-col gap-10 p-6 md:p-10"
      data-testid={xgestao ? 'xgestao-obras-page' : 'minhas-obras-empreiteiro-page'}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Minhas Obras"
            subtitle={
              xgestao
                ? 'Gerencie suas obras próprias e acompanhe o progresso da execução.'
                : 'Gerencie suas obras em execução e acompanhe o progresso operacional.'
            }
          />
          {xgestao && <NovaObraModal />}
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <AdvancedFiltersPopover activeCount={advancedActiveCount} onClearAll={clearAllAdvanced}>
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
              {!xgestao && (
                <MultiSelectDropdown
                  label="Contratante"
                  options={contratanteOptions}
                  values={contratanteSelected}
                  onChange={onFilterChange(setContratanteSelected)}
                  placeholder="Todos os contratantes"
                  searchPlaceholder="Buscar contratante..."
                  testIdPrefix="filter-contratante"
                />
              )}
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

            <div className="relative w-full sm:ml-auto sm:max-w-md sm:flex-1">
              <RiSearchLine className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar por título ou endereço..."
                value={searchQuery}
                onChange={(event) => onFilterChange(setSearchQuery)(event.target.value)}
                className="border-gray-200 bg-white pl-9 dark:border-gray-700 dark:bg-gray-900"
                data-testid="input-search-obras"
              />
            </div>
          </div>

          {advancedActiveCount > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {statusSelected.map((status) => (
                <ActiveFilterChip
                  key={status}
                  label={`Status: ${STATUS_LABELS[status] ?? status}`}
                  onRemove={() =>
                    onFilterChange(setStatusSelected)(statusSelected.filter((value) => value !== status))
                  }
                  testId={`active-chip-status-${status}`}
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
              {tipoSelected.map((tipo) => (
                <ActiveFilterChip
                  key={tipo}
                  label={`Tipo: ${tipo}`}
                  onRemove={() =>
                    onFilterChange(setTipoSelected)(tipoSelected.filter((value) => value !== tipo))
                  }
                  testId={`active-chip-tipo-${tipo}`}
                />
              ))}
              {!xgestao && contratanteSelected.map((nome) => (
                <ActiveFilterChip
                  key={nome}
                  label={`Contratante: ${nome}`}
                  onRemove={() =>
                    onFilterChange(setContratanteSelected)(
                      contratanteSelected.filter((value) => value !== nome),
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

      <MinhasObrasGrid obras={paginatedObras} basePath={basePath} />

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  setCurrentPage((page) => Math.max(1, page - 1));
                }}
                aria-disabled={currentPage === 1}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                data-testid="empreiteiro-obras-pagination-prev"
              />
            </PaginationItem>
            {getPaginationRange(currentPage, totalPages).map((item, index) =>
              item === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={currentPage === item}
                    onClick={(event) => {
                      event.preventDefault();
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
                onClick={(event) => {
                  event.preventDefault();
                  setCurrentPage((page) => Math.min(totalPages, page + 1));
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