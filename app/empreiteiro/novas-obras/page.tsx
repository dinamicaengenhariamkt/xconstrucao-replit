'use client';

import Link from 'next/link';
import { useState, useMemo, useEffect, useRef } from 'react';
import { RiSearchLine, RiLoader4Line, RiMapPin2Line } from 'react-icons/ri';
import { cn } from '@shared/lib/utils';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { NovasObrasGrid } from '@features/empreiteiro/novas-obras/components/NovasObrasGrid';
import { NovasObrasSkeleton } from '@features/empreiteiro/novas-obras/components/NovasObrasSkeleton';
import { BlockedBanner } from '@features/empreiteiro/novas-obras/components/BlockedBanner';
import {
  useNovasObrasInfinite,
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

  // Busca textual: input controlado + valor com debounce que vai pro servidor.
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Filtros client-side (rodam sobre rows carregadas)
  const [statusSelected, setStatusSelected] = useState<string[]>([]);
  const [complexidadeSelected, setComplexidadeSelected] = useState<string[]>([]);

  // Task #93: toggle "Só na minha zona" — vai pro servidor como `na_minha_zona=true`.
  const [naMinhaZonaOnly, setNaMinhaZonaOnly] = useState(false);

  const orcMinNum = orcamentoMin === '' ? undefined : Number(orcamentoMin);
  const orcMaxNum = orcamentoMax === '' ? undefined : Number(orcamentoMax);

  const queryParams = useMemo(() => {
    const p: Record<string, string | number | string[] | boolean> = { pageSize: PAGE_SIZE };
    if (debouncedSearch) p.q = debouncedSearch;
    if (cidade.trim()) p.cidade = cidade.trim();
    if (uf.trim()) p.uf = uf.trim().toUpperCase();
    if (modalidade) p.modalidade = modalidade;
    // API aceita lista (repetido ou CSV) — enviamos todos os valores selecionados.
    if (tipoSelected.length > 0) p.tipo = tipoSelected;
    if (materiaisPorSelected.length > 0) p.materiaisPor = materiaisPorSelected;
    if (orcMinNum !== undefined) p.minValor = orcMinNum;
    if (orcMaxNum !== undefined) p.maxValor = orcMaxNum;
    if (naMinhaZonaOnly) p.naMinhaZona = true;
    return p;
  }, [debouncedSearch, cidade, uf, modalidade, tipoSelected, materiaisPorSelected, orcMinNum, orcMaxNum, naMinhaZonaOnly]);

  const {
    data: obrasPayload,
    isLoading: obrasLoading,
    isError: obrasError,
    refetch: refetchObras,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNovasObrasInfinite(queryParams);
  const {
    data: perfilStatus,
    isLoading: perfilLoading,
    isError: perfilError,
  } = usePerfilStatus();
  useEffect(() => {
    if (perfilError) {
      console.warn(
        '[novas-obras] /api/empreiteiro/perfil-status falhou — liberando acesso por padrão.',
      );
    }
  }, [perfilError]);

  const rows = useMemo(
    () => (obrasPayload?.pages ?? []).flatMap((p) => p.rows),
    [obrasPayload],
  );
  const total = obrasPayload?.pages?.[0]?.total ?? 0;
  // Task #93: payload carrega `zonaConfigurada` apenas para role=empreiteiro.
  // Undefined enquanto a 1ª página carrega — usar `?? true` (assume configurada
  // até prova em contrário) pra evitar flash do empty-state pedindo configurar.
  const zonaConfigurada = obrasPayload?.pages?.[0]?.zonaConfigurada ?? true;

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
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, rows.length]);

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

  // Filtros client-side sobre rows da página atual. Busca textual (q) é server-side
  // via queryParams.q — filtra no SQL por nome/descrição em TODAS as obras publicadas,
  // não só nas já carregadas pelo infinite scroll.
  const filteredRows = useMemo(() => {
    let result = rows;
    if (statusSelected.length > 0) {
      result = result.filter((o) => statusSelected.includes(o.status));
    }
    if (complexidadeSelected.length > 0) {
      result = result.filter((o) => complexidadeSelected.includes(o.complexidade));
    }
    return result;
  }, [rows, statusSelected, complexidadeSelected]);

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
  };

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

  if ((obrasLoading && !obrasPayload) || perfilLoading) return <NovasObrasSkeleton />;

  const isBlocked = perfilStatus?.isBlocked ?? false;
  const loadedCount = rows.length;
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

            <button
              type="button"
              onClick={() => setNaMinhaZonaOnly((v) => !v)}
              aria-pressed={naMinhaZonaOnly}
              className={cn(
                'h-9 inline-flex items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors',
                naMinhaZonaOnly
                  ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
              )}
              data-testid="toggle-na-minha-zona"
            >
              <RiMapPin2Line className="w-4 h-4" />
              Só na minha zona
            </button>

            <div className="relative w-full sm:flex-1 sm:max-w-md sm:ml-auto">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por título ou descrição..."
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
              <span className="font-semibold text-primary">{total}</span> obra{total === 1 ? '' : 's'} encontrada{total === 1 ? '' : 's'} · {loadedCount} carregada{loadedCount === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      <div className={cn(isBlocked && 'opacity-40 pointer-events-none')}>
        {obrasError && rows.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-red-300 dark:border-red-800/50 bg-white dark:bg-gray-900 px-6 py-12 text-center"
            data-testid="error-state-novas-obras"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
              <RiSearchLine className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Não foi possível carregar as obras
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Ocorreu um erro ao buscar as obras disponíveis. Verifique sua conexão e tente novamente.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void refetchObras()}
              data-testid="button-retry-novas-obras"
            >
              Tentar novamente
            </Button>
          </div>
        ) : naMinhaZonaOnly && !zonaConfigurada ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-12 text-center"
            data-testid="empty-state-zona-nao-configurada"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <RiMapPin2Line className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Configure sua zona de atuação
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Você ainda não definiu UFs ou cidades em que atua. Configure sua zona para ver
                apenas obras compatíveis.
              </p>
            </div>
            <Link
              href="/empreiteiro/configuracoes"
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
              data-testid="link-configurar-zona"
            >
              Ir para Configurações
            </Link>
          </div>
        ) : naMinhaZonaOnly && rows.length === 0 && !obrasLoading ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-12 text-center"
            data-testid="empty-state-zona-sem-resultados"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
              <RiMapPin2Line className="h-6 w-6" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Nenhuma obra na sua zona no momento
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                Tente desligar o filtro ou ampliar sua zona em Configurações.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNaMinhaZonaOnly(false)}
                data-testid="button-desligar-na-minha-zona"
              >
                Mostrar todas as obras
              </Button>
              <Link
                href="/empreiteiro/configuracoes"
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                data-testid="link-ampliar-zona"
              >
                Ampliar zona
              </Link>
            </div>
          </div>
        ) : (
          <NovasObrasGrid obras={filteredRows} isBlocked={isBlocked} />
        )}
      </div>

      {!isBlocked && (hasNextPage || isFetchingNextPage) && (
        <div
          ref={sentinelRef}
          className="flex flex-col items-center justify-center gap-3 py-6"
          data-testid="novas-obras-infinite-sentinel"
        >
          {isFetchingNextPage ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              data-testid="novas-obras-infinite-loading"
            >
              <RiLoader4Line className="h-4 w-4 animate-spin" />
              Carregando mais obras...
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchNextPage()}
              data-testid="novas-obras-load-more"
            >
              Carregar mais
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
