'use client';

import { TimelineDisplay } from '@features/shared/components/TimelineDisplay';
import type { TimelineEvent } from '../types';

interface TimelineSectionProps {
  events: TimelineEvent[];
}

export function TimelineSection({ events }: TimelineSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <TimelineDisplay
        events={events}
        title="Timeline Operacional"
        subtitle="Histórico completo de atividades"
      />
    </div>
  );
}
