'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiSearchLine } from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { useNovasObras } from '@features/empreiteiro/novas-obras/hooks/use-novas-obras';
import { useObrasSalvasStore } from '@features/empreiteiro/novas-obras/store/obras-salvas-store';
import { NovaObraCard } from '@features/empreiteiro/novas-obras/components/NovaObraCard';
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
import {
  IconBookmark,
  IconBookmarkFill,
  IconSearch,
} from '@shared/components/icons';

export default function ObrasSalvasPage() {
  const { data: todasObras, isLoading } = useNovasObras();
  const savedIds = useObrasSalvasStore((s) => s.savedIds);
  const toggleSave = useObrasSalvasStore((s) => s.toggleSave);

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

  const obrasSalvas = useMemo(
    () => (todasObras ?? []).filter((o) => savedIds.includes(o.id)),
    [todasObras, savedIds],
  );

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    obrasSalvas.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(NOVAS_OBRAS_STATUS_LABELS).map(([value, label]) => ({
      value,
      label: `${label} (${counts[value] || 0})`,
    }));
  }, [obrasSalvas]);

  const complexidadeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    obrasSalvas.forEach((o) => {
      counts[o.complexidade] = (counts[o.complexidade] || 0) + 1;
    });
    return Object.entries(COMPLEXIDADE_LABELS).map(([value, label]) => ({
      value,
      label: `${label} (${counts[value] || 0})`,
    }));
  }, [obrasSalvas]);

  const tipoOptions = useMemo(() => {
    const set = new Set(obrasSalvas.map((o) => o.tipo));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((t) => ({ value: t, label: t }));
  }, [obrasSalvas]);

  const filteredObras = useMemo(() => {
    let result = obrasSalvas;
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
    obrasSalvas,
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

  const subtitle =
    obrasSalvas.length > 0
      ? `${obrasSalvas.length} obra${obrasSalvas.length !== 1 ? 's' : ''} salva${obrasSalvas.length !== 1 ? 's' : ''} para acompanhamento.`
      : 'Suas obras favoritas aparecem aqui para acompanhamento e candidatura posterior.';

  if (isLoading) {
    return (
      <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800 aspect-[4/3]"
          />
        ))}
      </div>
    );
  }

  if (obrasSalvas.length === 0) {
    return (
      <div className="p-10 flex flex-col gap-10" data-testid="obras-salvas-empreiteiro-page">
        <PageHeader title="Obras Salvas" subtitle={subtitle} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4 text-center"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <IconBookmark className="text-gray-300 text-4xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">
            Nenhuma obra salva ainda
          </h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Explore as obras disponíveis e clique em &quot;Salvar Obra&quot; para guardar suas
            favoritas aqui.
          </p>
          <Link
            href="/empreiteiro/novas-obras"
            className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <IconSearch className="text-lg" />
            Explorar Novas Obras
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="obras-salvas-empreiteiro-page">
      <div className="flex flex-col gap-6 mb-12">
        <PageHeader title="Obras Salvas" subtitle={subtitle} />

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
                data-testid="input-search-obras-salvas"
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

      {paginatedObras.length === 0 ? (
        <div className="text-center py-20" data-testid="empty-state-obras-salvas-filtros">
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">
            Nenhuma obra encontrada
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Tente alterar os filtros de busca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {paginatedObras.map((obra, i) => (
            <motion.div
              key={obra.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative group"
            >
              <NovaObraCard obra={obra} />
              <button
                onClick={() => toggleSave(obra.id)}
                className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow hover:bg-white dark:hover:bg-gray-900 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Remover dos salvos"
                data-testid={`obra-salva-remove-${obra.id}`}
              >
                <IconBookmarkFill className="text-primary text-sm" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

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
                data-testid="obras-salvas-pagination-prev"
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
                    data-testid={`obras-salvas-pagination-page-${item}`}
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
                data-testid="obras-salvas-pagination-next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
