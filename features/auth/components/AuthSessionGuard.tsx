'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ImpersonationBanner } from '@features/admin/components/ImpersonationBanner';

interface MeData {
  mustChangePassword?: boolean;
  ativo?: boolean;
  impersonation?: unknown;
}

/**
 * Guard cliente que:
 * - Redireciona para /trocar-senha-obrigatoria quando a conta exige
 * - Renderiza o ImpersonationBanner quando há modo "Ver como" ativo
 */
export function AuthSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'include', cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: MeData | null) => {
        if (cancelled) return;
        if (data?.mustChangePassword && pathname !== '/trocar-senha-obrigatoria') {
          router.replace('/trocar-senha-obrigatoria');
          return;
        }
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => { cancelled = true; };
  }, [pathname, router]);

  if (!ready) return null;
  return (
    <>
      <ImpersonationBanner />
      {children}
    </>
  );
}
