'use client';

import { EtapasJ06Card } from '@features/obras/medicoes/components/EtapasJ06Card';
import type { ObraContratanteDetalhe, ProgressColor } from '../types';

interface TabEtapasProps {
  obra: ObraContratanteDetalhe;
  progressColor: ProgressColor;
}

export function TabEtapas({ obra }: TabEtapasProps) {
  return <EtapasJ06Card obraId={obra.id} canWrite canEditScope />;
}
