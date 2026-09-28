'use client';

import { CronogramaGanttCard } from '@features/empreiteiro/minhas-obras/components/CronogramaGanttCard';
import type { ObraPublicaEtapa } from '../types';

/** XG30 — o mesmo Gantt do console, com os dados da projeção e sem ações. */
export function TabCronogramaPublica({ obraId, etapas }: { obraId: string; etapas: ObraPublicaEtapa[] }) {
  return <CronogramaGanttCard obraId={obraId} data={etapas} readOnly />;
}
