'use client';

import { TimelineDisplay } from '@features/shared/components/TimelineDisplay';
import type { ObraContratanteDetalhe } from '../types';

interface TabTimelineProps {
  obra: ObraContratanteDetalhe;
}

export function TabTimeline({ obra }: TabTimelineProps) {
  return (
    <div data-testid="tab-content-timeline">
      <TimelineDisplay
        events={obra.timeline ?? []}
        title="Timeline da Obra"
        subtitle="Atualizações registradas pelo empreiteiro"
      />
    </div>
  );
}
