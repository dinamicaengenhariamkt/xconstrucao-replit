'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@features/shared/components/PageHeader';
import { FilterChips } from '@features/shared/components/FilterChips';
import { ObrasContratanteGrid } from '@features/contratante/minhas-obras/components/ObrasContratanteGrid';
import { ObrasContratanteSkeleton } from '@features/contratante/minhas-obras/components/ObrasContratanteSkeleton';
import { useObrasContratante } from '@features/contratante/minhas-obras/hooks/use-minhas-obras';
import { STATUS_LABELS } from '@shared/constants/status';
import type { FilterChipOption } from '@features/shared/types';
import type { ObraContratante } from '@features/contratante/minhas-obras/types';
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

function buildFilterOptions(obras: ObraContratante[]): FilterChipOption[] {
  const counts: Record<string, number> = {};
  obras.forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });

  return [
    { label: 'Todas', value: 'todas', count: obras.length },
    ...Object.entries(STATUS_LABELS).map(([value, label]) => ({
      label,
      value,
      count: counts[value] || 0,
    })),
  ];
}

export default function MinhasObrasContratantePage() {
  const { data: obras, isLoading } = useObrasContratante();
  const [activeFilter, setActiveFilter] = useState('todas');
  const saude = useSaudeFilter();

  const filterOptions = useMemo(() => buildFilterOptions(obras || []), [obras]);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    let result = obras;
    if (activeFilter !== 'todas') {
      result = result.filter((o) => o.status === activeFilter);
    }
    if (saude.value) {
      result = result.filter((o) => getMockHealth(o.id).status === saude.value);
    }
    return result;
  }, [obras, activeFilter, saude.value]);

  const healthSummary = useMemo(
    () => getMockHealthSummary((obras ?? []).map((o) => o.id)),
    [obras]
  );

  if (isLoading) return <ObrasContratanteSkeleton />;

  const advancedActiveCount = saude.value ? 1 : 0;

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="minhas-obras-contratante-page">
      <div className="flex flex-col gap-6 mb-12">
        <PageHeader
          title="Minhas Obras"
          subtitle="Acompanhe todas as suas obras em andamento e finalizadas."
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <FilterChips
              options={filterOptions}
              activeValue={activeFilter}
              onSelect={setActiveFilter}
            />
            <div className="sm:ml-auto">
              <AdvancedFiltersPopover
                activeCount={advancedActiveCount}
                onClearAll={() => saude.setValue(undefined)}
              >
                <HealthFilterSelect
                  value={saude.value}
                  onChange={saude.setValue}
                  summary={healthSummary}
                />
              </AdvancedFiltersPopover>
            </div>
          </div>
          {saude.value && (
            <div className="flex items-center gap-2 flex-wrap">
              <ActiveFilterChip
                label={`Saúde: ${HEALTH_LABELS[saude.value]}`}
                onRemove={() => saude.setValue(undefined)}
                dotClassName={HEALTH_DOT_CLASSES[saude.value]}
                testId="active-chip-saude"
              />
            </div>
          )}
        </div>
      </div>
      <ObrasContratanteGrid obras={filteredObras} />
    </div>
  );
}
