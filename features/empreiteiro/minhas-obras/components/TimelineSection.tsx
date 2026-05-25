'use client';

import { TimelineDisplay } from '@features/shared/components/TimelineDisplay';
import { useAtividadesObra, toAtividadeDisplay } from '@features/atividades/hooks/use-atividades';
import type { TimelineEvent } from '../types';

interface TimelineSectionProps {
  /** ID real da obra para hidratar do feed J07. */
  obraId: string;
  /** Eventos de fallback (derivados do build-detalhe server) — mostrados enquanto a query carrega. */
  fallbackEvents?: TimelineEvent[];
}

export function TimelineSection({ obraId, fallbackEvents = [] }: TimelineSectionProps) {
  const { data, isLoading } = useAtividadesObra(obraId, 100);

  const events: TimelineEvent[] = isLoading || !data
    ? fallbackEvents
    : data.items.map((item) => {
        const d = toAtividadeDisplay(item, 'empreiteiro');
        return {
          id: d.id,
          tipo: d.tipoTimeline,
          titulo: d.titulo,
          descricao: d.descricao,
          autor: d.actorName,
          data: d.createdAt,
        };
      });

  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
      <TimelineDisplay
        events={events}
        title="Timeline Operacional"
        subtitle="Histórico real de eventos desta obra"
      />
    </div>
  );
}
