'use client';

import { useState, useMemo, useEffect } from 'react';
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

const PAGE_SIZE = 20;

export default function NovasObrasPage() {
  // Filtros server-side
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [modalidade, setModalidade] = useState<string>('');
  const [tipoSelected, setTipoSelected] = useState<string[]>([]);
  const [materiaisPorSelected, setMateriaisPorSelected] = useState<string[]>([]);
  const [orcamentoMin, setOrcamentoMin] = useState('');
  const [orcamentoMax, setOrcamentoMax] = useState('');
  const [page, setPage] = useState(1);

  // Filtros client-side (rodam sobre rows da página atual)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusSelected, setStatusSelected] = useState<string[]>([]);
  const [complexidadeSelected, setComplexidadeSelected] = useState<string[]>([]);

  const orcMinNum = orcamentoMin === '' ? undefined : Number(orcamentoMin);
  const orcMaxNum = orcamentoMax === '' ? undefined : Number(orcamentoMax);

  const queryParams = useMemo(() => {
    const p: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
    if (cidade.trim()) p.cidade = cidade.trim();
    if (uf.trim()) p.uf = uf.trim().toUpperCase();
    if (modalidade) p.modalidade = modalidade;
    // API aceita apenas 1 valor por filtro — quando há multi-seleção, deixamos sem param e filtramos client-side.
    if (tipoSelected.length === 1) p.tipo = tipoSelected[0];
    if (materiaisPorSelected.length === 1) p.materiaisPor = materiaisPorSelected[0];
    if (orcMinNum !== undefined) p.minValor = orcMinNum;
    if (orcMaxNum !== undefined) p.maxValor = orcMaxNum;
    return p;
  }, [page, cidade, uf, modalidade, tipoSelected, materiaisPorSelected, orcMinNum, orcMaxNum]);

  const { data: obrasPayload, isLoading: obrasLoading } = useNovasObras(queryParams);
  const { data: perfilStatus, isLoading: perfilLoading } = usePerfilStatus();

  const rows = obrasPayload?.rows ?? [];
  const total = obrasPayload?.total ?? 0;
  const totalPages = obrasPayload?.totalPages ?? 0;

  // Reset page quando filtro server muda
  useEffect(() => {
    setPage(1);
  }, [cidade, uf, modalidade, tipoSelected, materiaisPorSelected, orcMinNum, orcMaxNum]);

  // Clamp page se totalPages mudar pra menor
  useEffect(() => {
    if (totalPages > 0 && page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
  };

  const statusOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(NOVAS_OBRAS_STATUS_LABELS).map(([value, label]) => ({
      value,
      label: `${label} (${counts[value] || 0})`,
    }));
  }, [rows]);

  const complexidadeOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach((o) => {
      counts[o.complexidade] = (counts[o.complexidade] || 0) + 1;
    });
    return Object.entries(COMPLEXIDADE_LABELS).map(([value, label]) => ({
      value,
      label: `${label} (${counts[value] || 0})`,
    }));
  }, [rows]);

  const tipoOptions = useMemo(() => {
    const set = new Set(rows.map((o) => o.tipo));
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'))
      .map((t) => ({ value: t, label: t }));
  }, [rows]);

  const materiaisPorOptions = useMemo(
    () => [
      { value: 'contratante', label: 'Contratante' },
      { value: 'empreiteiro', label: 'Empreiteiro' },
      { value: 'misto', label: 'Misto' },
    ],
    [],
  );

  // Filtros client-side sobre rows da página atual
  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusSelected.length > 0) {
      result = result.filter((o) => statusSelected.includes(o.status));
    }
    if (complexidadeSelected.length > 0) {
      result = result.filter((o) => complexidadeSelected.includes(o.complexidade));
    }
    // Multi-seleção de tipo/materiaisPor: API só aceita 1, então filtramos aqui quando há 2+.
    if (tipoSelected.length > 1) {
      result = result.filter((o) => tipoSelected.includes(o.tipo));
    }
    if (materiaisPorSelected.length > 1) {
      result = result.filter((o) =>
        o.materiaisPor ? materiaisPorSelected.includes(o.materiaisPor) : false,
      );
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
  }, [rows, statusSelected, complexidadeSelected, tipoSelected, materiaisPorSelected, searchQuery]);

  const advancedActiveCount =
    (cidade.trim() ? 1 : 0) +
    (uf.trim() ? 1 : 0) +
    (modalidade ? 1 : 0) +
    (statusSelected.length > 0 ? 1 : 0) +
    (complexidadeSelected.length > 0 ? 1 : 0) +
    (tipoSelected.length > 0 ? 1 : 0) +
    (materiaisPorSelected.length > 0 ? 1 : 0) +
    (orcMinNum !== undefined || orcMaxNum !== undefined ? 1 : 0);

  const MODALIDADE_LABELS: Record<string, string> = {
    administracao: 'Administração',
    empreitada_global: 'Empreitada global',
    empreitada_etapa: 'Empreitada por etapa',
  };

  const clearAllAdvanced = () => {
    setCidade('');
    setUf('');
    setModalidade('');
    setStatusSelected([]);
    setComplexidadeSelected([]);
    setTipoSelected([]);
    setMateriaisPorSelected([]);
    setOrcamentoMin('');
    setOrcamentoMax('');
    setPage(1);
  };

  if ((obrasLoading && !obrasPayload) || perfilLoading) return <NovasObrasSkeleton />;

  const isBlocked = perfilStatus?.isBlocked ?? false;
  const showServerInfo = total > 0;

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
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Cidade</label>
                <Input
                  placeholder="Ex.: São Paulo"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="h-9 text-sm"
                  data-testid="filter-cidade-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">UF</label>
                <Input
                  placeholder="Ex.: SP"
                  value={uf}
                  maxLength={2}
                  onChange={(e) => setUf(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 2))}
                  className="h-9 text-sm uppercase"
                  data-testid="filter-uf-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Modalidade</label>
                <select
                  value={modalidade}
                  onChange={(e) => setModalidade(e.target.value)}
                  className="h-9 text-sm rounded-md border border-input bg-background px-3"
                  data-testid="filter-modalidade-select"
                >
                  <option value="">Todas</option>
                  <option value="administracao">Administração</option>
                  <option value="empreitada_global">Empreitada global</option>
                  <option value="empreitada_etapa">Empreitada por etapa</option>
                </select>
              </div>
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
              <MultiSelectDropdown
                label="Materiais por"
                options={materiaisPorOptions}
                values={materiaisPorSelected}
                onChange={onFilterChange(setMateriaisPorSelected)}
                placeholder="Qualquer"
                testIdPrefix="filter-materiais-por"
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
                placeholder="Buscar nesta página por título, endereço ou tipo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                data-testid="input-search-novas-obras"
              />
            </div>
          </div>

          {advancedActiveCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {cidade.trim() && (
                <ActiveFilterChip
                  label={`Cidade: ${cidade.trim()}`}
                  onRemove={() => setCidade('')}
                  testId="active-chip-cidade"
                />
              )}
              {uf.trim() && (
                <ActiveFilterChip
                  label={`UF: ${uf.trim()}`}
                  onRemove={() => setUf('')}
                  testId="active-chip-uf"
                />
              )}
              {modalidade && (
                <ActiveFilterChip
                  label={`Modalidade: ${MODALIDADE_LABELS[modalidade] ?? modalidade}`}
                  onRemove={() => setModalidade('')}
                  testId="active-chip-modalidade"
                />
              )}
              {statusSelected.map((s) => (
                <ActiveFilterChip
                  key={s}
                  label={`Status: ${NOVAS_OBRAS_STATUS_LABELS[s] ?? s}`}
                  onRemove={() =>
                    setStatusSelected(statusSelected.filter((x) => x !== s))
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
                    setComplexidadeSelected(complexidadeSelected.filter((x) => x !== c))
                  }
                  testId={`active-chip-complexidade-${c}`}
                />
              ))}
              {tipoSelected.map((t) => (
                <ActiveFilterChip
                  key={t}
                  label={`Tipo: ${t}`}
                  onRemove={() => setTipoSelected(tipoSelected.filter((x) => x !== t))}
                  testId={`active-chip-tipo-${t}`}
                />
              ))}
              {materiaisPorSelected.map((m) => (
                <ActiveFilterChip
                  key={m}
                  label={`Materiais: ${m}`}
                  onRemove={() => setMateriaisPorSelected(materiaisPorSelected.filter((x) => x !== m))}
                  testId={`active-chip-materiais-${m}`}
                />
              ))}
              {(orcMinNum !== undefined || orcMaxNum !== undefined) && (
                <ActiveFilterChip
                  label={`Orçamento: ${formatRange(orcamentoMin, orcamentoMax, { prefix: 'R$ ' })}`}
                  onRemove={() => {
                    setOrcamentoMin('');
                    setOrcamentoMax('');
                  }}
                  testId="active-chip-orcamento"
                />
              )}
            </div>
          )}

          {showServerInfo && (
            <p className="text-xs text-muted-foreground" data-testid="novas-obras-total-info">
              <span className="font-semibold text-primary">{total}</span> obra{total === 1 ? '' : 's'} encontrada{total === 1 ? '' : 's'} · página {page} de {totalPages}
            </p>
          )}
        </div>
      </div>

      <div className={cn(isBlocked && 'opacity-40 pointer-events-none')}>
        <NovasObrasGrid obras={filteredRows} isBlocked={isBlocked} />
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
                data-testid="novas-obras-pagination-prev"
              />
            </PaginationItem>
            {getPaginationRange(page, totalPages).map((item, idx) =>
              item === 'ellipsis' ? (
                <PaginationItem key={`ellipsis-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={page === item}
                    onClick={(e) => {
                      e.preventDefault();
                      setPage(item);
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
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                aria-disabled={page === totalPages}
                className={page === totalPages ? 'pointer-events-none opacity-50' : ''}
                data-testid="novas-obras-pagination-next"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
