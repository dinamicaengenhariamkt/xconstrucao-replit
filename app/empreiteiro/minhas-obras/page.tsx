'use client';

import { useState, useMemo } from 'react';
import { PageHeader } from '@features/shared/components/PageHeader';
import { FilterChips } from '@features/shared/components/FilterChips';
import { MinhasObrasGrid } from '@features/empreiteiro/minhas-obras/components/MinhasObrasGrid';
import { MinhasObrasSkeleton } from '@features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton';
import { useMinhasObras } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import { STATUS_LABELS } from '@features/empreiteiro/minhas-obras/constants';
import type { FilterChipOption } from '@features/shared/types';
import type { MinhaObra } from '@features/empreiteiro/minhas-obras/types';

function buildFilterOptions(obras: MinhaObra[]): FilterChipOption[] {
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

export default function MinhasObrasPage() {
  const { data: obras, isLoading } = useMinhasObras();
  const [activeFilter, setActiveFilter] = useState('todas');

  const filterOptions = useMemo(() => buildFilterOptions(obras || []), [obras]);

  const filteredObras = useMemo(() => {
    if (!obras) return [];
    if (activeFilter === 'todas') return obras;
    return obras.filter((o) => o.status === activeFilter);
  }, [obras, activeFilter]);

  if (isLoading) return <MinhasObrasSkeleton />;

  return (
    <div className="p-10 flex flex-col gap-10">
      <div className="flex flex-col gap-8 mb-12">
        <PageHeader
          title="Minhas Obras"
          subtitle="Gerencie suas obras em execução e acompanhe o progresso operacional."
        />
        <FilterChips
          options={filterOptions}
          activeValue={activeFilter}
          onSelect={setActiveFilter}
        />
      </div>
      <MinhasObrasGrid obras={filteredObras} />
    </div>
  );
}
