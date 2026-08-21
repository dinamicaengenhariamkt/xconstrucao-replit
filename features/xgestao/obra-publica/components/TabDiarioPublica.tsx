'use client';

import { DiarioJ06Card } from '@features/obras/medicoes/components/DiarioJ06Card';
import type { ObraPublicaDiario } from '../types';

export function TabDiarioPublica({ obraId, diario }: { obraId: string; diario: ObraPublicaDiario[] }) {
  return <DiarioJ06Card obraId={obraId} canWrite={false} data={diario} />;
}