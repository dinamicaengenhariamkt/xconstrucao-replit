'use client';

import { DiarioJ06Card } from '@features/obras/medicoes/components/DiarioJ06Card';
import { TimelineDisplay } from '@features/shared/components/TimelineDisplay';
import { useAuthStore } from '@features/auth/store/auth-store';
import { useAtividadesObra, toAtividadeDisplay } from '@features/atividades/hooks/use-atividades';
import type { ObraContratanteDetalhe } from '../types';

interface Props {
  obra: ObraContratanteDetalhe;
}

export function TabTimeline({ obra }: Props) {
  const user = useAuthStore((s) => s.user);
  const { data } = useAtividadesObra(obra.id, 100);

  const events = (data?.items ?? []).map((item) => {
    const d = toAtividadeDisplay(item, 'contratante');
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
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <TimelineDisplay
          events={events}
          title="Timeline Operacional"
          subtitle="Histórico real de eventos desta obra"
        />
      </div>
      <DiarioJ06Card obraId={obra.id} canWrite currentUserId={user?.id ?? null} />
    </div>
  );
}
