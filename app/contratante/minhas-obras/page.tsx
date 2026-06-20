'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { RiSearchLine, RiLoader4Line } from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { ObrasContratanteGrid } from '@features/contratante/minhas-obras/components/ObrasContratanteGrid';
import { ObrasContratanteSkeleton } from '@features/contratante/minhas-obras/components/ObrasContratanteSkeleton';
import { useObrasContratanteInfinite } from '@features/contratante/minhas-obras/hooks/use-minhas-obras';
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
import { formatRange } from '@shared/lib/formatters';

const PAGE_SIZE = 20;

export default function MinhasObrasContratantePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  // "Meus rascunhos" (dropdown do usuário) navega para cá com ?visibilidade=rascunho.
  const visibilidadeFilter = searchParams?.get('visibilidade') ?? undefined;
  const isRascunhoView = visibilidadeFilter === 'rascunho';
  const {
    data: obrasPayload,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useObrasContratanteInfinite({ pageSize: PAGE_SIZE, visibilidade: visibilidadeFilter });
  const obras = useMemo(
    () => (obrasPayload?.pages ?? []).flatMap((p) => p.rows),
    [obrasPayload],
  );
  const totalServer = obrasPayload?.pages?.[0]?.total ?? 0;
  const { data: healthMap } = useObrasHealthMap('contratante');
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
  const [empreiteiroSelected, setEmpreiteiroSelected] = useState<string[]>([]);
  const [orcamentoMin, setOrcamentoMin] = useState('');
  const [orcamentoMax, setOrcamentoMax] = useState('');
  const [progressoMin, setProgressoMin] = useState('');
  const [progressoMax, setProgressoMax] = useState('');

  const orcMinNum = orcamentoMin === '' ? undefined : Number(orcamentoMin);
  const orcMaxNum = orcamentoMax === '' ? undefined : Number(orcamentoMax);
  const progMinNum = progressoMin === '' ? undefined : Number(progressoMin);
  const progMaxNum = progressoMax === '' ? undefined : Number(progressoMax);

  const onFilterChange = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
  };

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, obras.length]);

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

  const empreiteiroOptions = useMemo(() => {
    const set = new Set((obras ?? []).map((o) => o.empreiteiro.nome));
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
      result = result.filter((o) => healthMap?.[o.id]?.status === saude.value);
    }
    if (tipoSelected.length > 0) {
      result = result.filter((o) => tipoSelected.includes(o.tipo));
    }
    if (empreiteiroSelected.length > 0) {
      result = result.filter((o) => empreiteiroSelected.includes(o.empreiteiro.nome));
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
    healthMap,
    statusSelected,
    saude.value,
    tipoSelected,
    empreiteiroSelected,
    orcMinNum,
    orcMaxNum,
    progMinNum,
    progMaxNum,
    searchQuery,
  ]);

  const healthSummary = useMemo(() => summarizeHealthMap(healthMap), [healthMap]);

  const advancedActiveCount =
    (statusSelected.length > 0 ? 1 : 0) +
    (saude.value ? 1 : 0) +
    (tipoSelected.length > 0 ? 1 : 0) +
    (empreiteiroSelected.length > 0 ? 1 : 0) +
    (orcMinNum !== undefined || orcMaxNum !== undefined ? 1 : 0) +
    (progMinNum !== undefined || progMaxNum !== undefined ? 1 : 0);

  const clearAllAdvanced = () => {
    setStatusSelected([]);
    saude.setValue(undefined);
    setTipoSelected([]);
    setEmpreiteiroSelected([]);
    setOrcamentoMin('');
    setOrcamentoMax('');
    setProgressoMin('');
    setProgressoMax('');
  };

  if (isLoading && !obrasPayload) return <ObrasContratanteSkeleton />;

  const loadedCount = obras.length;
  const showServerInfo = totalServer > 0;

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="minhas-obras-contratante-page">
      <div className="flex flex-col gap-6 mb-12">
        <PageHeader
          title={isRascunhoView ? 'Meus rascunhos' : 'Minhas Obras'}
          subtitle={
            isRascunhoView
              ? 'Obras salvas como rascunho. Continue a edição ou publique para receber candidaturas.'
              : 'Acompanhe todas as suas obras em andamento e finalizadas.'
          }
        />
        {isRascunhoView && (
          <div>
            <ActiveFilterChip
              label="Visibilidade: Rascunho"
              onRemove={() => router.push('/contratante/minhas-obras')}
              testId="filter-chip-rascunho"
            />
          </div>
        )}
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
                label="Empreiteiro"
                options={empreiteiroOptions}
                values={empreiteiroSelected}
                onChange={onFilterChange(setEmpreiteiroSelected)}
                placeholder="Todos os empreiteiros"
                searchPlaceholder="Buscar empreiteiro..."
                testIdPrefix="filter-empreiteiro"
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
              {empreiteiroSelected.map((nome) => (
                <ActiveFilterChip
                  key={nome}
                  label={`Empreiteiro: ${nome}`}
                  onRemove={() =>
                    onFilterChange(setEmpreiteiroSelected)(
                      empreiteiroSelected.filter((x) => x !== nome),
                    )
                  }
                  testId={`active-chip-empreiteiro-${nome}`}
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

          {showServerInfo && (
            <p
              className="text-xs text-muted-foreground"
              data-testid="minhas-obras-contratante-total-info"
            >
              <span className="font-semibold text-primary">{totalServer}</span> obra
              {totalServer === 1 ? '' : 's'} no total · {loadedCount} carregada
              {loadedCount === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      <ObrasContratanteGrid obras={filteredObras} />

      {(hasNextPage || isFetchingNextPage) && (
        <div
          ref={sentinelRef}
          className="flex flex-col items-center justify-center gap-3 py-6"
          data-testid="minhas-obras-contratante-infinite-sentinel"
        >
          {isFetchingNextPage ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              data-testid="minhas-obras-contratante-infinite-loading"
            >
              <RiLoader4Line className="h-4 w-4 animate-spin" />
              Carregando mais obras...
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchNextPage()}
              data-testid="minhas-obras-contratante-load-more"
            >
              Carregar mais
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
