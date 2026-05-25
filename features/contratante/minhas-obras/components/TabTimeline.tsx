'use client';

import { DiarioJ06Card } from '@features/obras/medicoes/components/DiarioJ06Card';
import { useAuthStore } from '@features/auth/store/auth-store';
import type { ObraContratanteDetalhe } from '../types';

interface Props {
  obra: ObraContratanteDetalhe;
}

export function TabTimeline({ obra }: Props) {
  const user = useAuthStore((s) => s.user);
  return <DiarioJ06Card obraId={obra.id} canWrite currentUserId={user?.id ?? null} />;
}
