'use client';

import { FotosJ06Card } from '@features/obras/medicoes/components/FotosJ06Card';
import { useAuthStore } from '@features/auth/store/auth-store';
import type { ObraContratanteDetalhe } from '../types';

interface Props {
  obra: ObraContratanteDetalhe;
}

export function TabFotos({ obra }: Props) {
  const user = useAuthStore((s) => s.user);
  return (
    <FotosJ06Card
      obraId={obra.id}
      canWrite
      currentUserId={user?.id ?? null}
      currentUserRole={user?.role}
    />
  );
}
