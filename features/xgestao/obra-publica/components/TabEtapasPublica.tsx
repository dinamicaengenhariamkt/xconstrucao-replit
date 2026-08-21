'use client';

import { EtapasJ06Card } from '@features/obras/medicoes/components/EtapasJ06Card';
import type { ObraPublicaEtapa } from '../types';

export function TabEtapasPublica({ obraId, etapas }: { obraId: string; etapas: ObraPublicaEtapa[] }) {
  return <EtapasJ06Card obraId={obraId} canWrite={false} canEditScope={false} data={etapas} />;
}