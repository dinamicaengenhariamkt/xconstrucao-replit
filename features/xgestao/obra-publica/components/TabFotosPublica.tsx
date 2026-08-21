'use client';

import { FotosJ06Card } from '@features/obras/medicoes/components/FotosJ06Card';
import type { ObraPublicaFoto } from '../types';

export function TabFotosPublica({ obraId, fotos }: { obraId: string; fotos: ObraPublicaFoto[] }) {
  return <FotosJ06Card obraId={obraId} canWrite={false} data={fotos} />;
}