'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@features/shared/components/PageHeader';
import { FilterChips } from '@features/shared/components/FilterChips';
import { NovasObrasGrid } from '@features/empreiteiro/novas-obras/components/NovasObrasGrid';
import { NovasObrasSkeleton } from '@features/empreiteiro/novas-obras/components/NovasObrasSkeleton';
import { BlockedBanner } from '@features/empreiteiro/novas-obras/components/BlockedBanner';
import { useNovasObras, usePerfilStatus } from '@features/empreiteiro/novas-obras/hooks/use-novas-obras';
import { COMPLEXIDADE_LABELS } from '@features/empreiteiro/novas-obras/constants';
import type { FilterChipOption } from '@features/shared/types';
import type { NovaObra } from '@features/empreiteiro/novas-obras/types';

function buildFilterOptions(obras: NovaObra[]): FilterChipOption[] {
  const counts: Record<string, number> = {};
  obras.forEach((o) => { counts[o.complexidade] = (counts[o.complexidade] || 0) + 1; });

  return [
    { label: 'Todas', value: 'todas', count: obras.length },
    ...Object.entries(COMPLEXIDADE_LABELS).map(([value, label]) => ({
      label,
      value,
      count: counts[value] || 0,
    })),
  ];
}

export default function NovasObrasPage() {
  const { data: obras, isLoading: obrasLoading } = useNovasObras();
  const { data: perfilStatus, isLoading: perfilLoading } = usePerfilStatus();
  const [activeFilter, setActiveFilter] = useState('todas');

  const filterOptions = useMemo(() => buildFilterOptions(obras || []), [obras]);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    if (activeFilter === 'todas') return obras;
    return obras.filter((o) => o.complexidade === activeFilter);
  }, [obras, activeFilter]);

  if (obrasLoading || perfilLoading) return <NovasObrasSkeleton />;

  const isBlocked = perfilStatus?.isBlocked ?? false;

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex flex-col gap-8 mb-12">
        <PageHeader
          title="Novas Obras Disponiveis"
          subtitle="Encontre novas oportunidades de trabalho e candidate-se as obras disponiveis."
        />
        {isBlocked && perfilStatus && (
          <BlockedBanner perfilStatus={perfilStatus} />
        )}
        <FilterChips
          options={filterOptions}
          activeValue={activeFilter}
          onSelect={setActiveFilter}
        />
      </div>
      <NovasObrasGrid obras={filteredObras} isBlocked={isBlocked} />
    </div>
  );
}
