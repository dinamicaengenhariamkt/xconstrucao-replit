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

  const filterOptions = useMemo(() => buildFilterOptions(obras || []), [obras]);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    if (activeFilter === 'todas') return obras;
    return obras.filter((o) => o.status === activeFilter);
  }, [obras, activeFilter]);

  if (isLoading) return <ObrasContratanteSkeleton />;

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="minhas-obras-contratante-page">
      <div className="flex flex-col gap-8 mb-12">
        <PageHeader
          title="Minhas Obras"
          subtitle="Acompanhe todas as suas obras em andamento e finalizadas."
        />
        <FilterChips
          options={filterOptions}
          activeValue={activeFilter}
          onSelect={setActiveFilter}
        />
      </div>
      <ObrasContratanteGrid obras={filteredObras} />
    </div>
  );
}
