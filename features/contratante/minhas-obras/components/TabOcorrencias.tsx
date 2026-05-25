'use client';

import { OcorrenciasJ06Card } from '@features/obras/medicoes/components/OcorrenciasJ06Card';
import type { ObraContratanteDetalhe } from '../types';

interface Props {
  obra: ObraContratanteDetalhe;
}

export function TabOcorrencias({ obra }: Props) {
  return <OcorrenciasJ06Card obraId={obra.id} canWrite />;
}
