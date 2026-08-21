'use client';

import { OcorrenciasJ06Card } from '@features/obras/medicoes/components/OcorrenciasJ06Card';
import type { ObraPublicaOcorrencia } from '../types';

export function TabOcorrenciasPublica({ obraId, ocorrencias }: { obraId: string; ocorrencias: ObraPublicaOcorrencia[] }) {
  return <OcorrenciasJ06Card obraId={obraId} canWrite={false} data={ocorrencias} />;
}